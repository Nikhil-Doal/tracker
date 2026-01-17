from datetime import datetime
from bson import ObjectId
import bcrypt


class User:
    """User model"""
    
    def __init__(self, email, name, password_hash=None, oauth_provider=None, oauth_id=None):
        self.email = email
        self.name = name
        self.password_hash = password_hash
        self.oauth_provider = oauth_provider
        self.oauth_id = oauth_id
        self.created_at = datetime.utcnow()
        self.settings = {
            'sync_interval': 5,  # minutes
            'categorization': {}
        }
    
    def to_dict(self):
        """Convert to dictionary for MongoDB"""
        return {
            'email': self.email,
            'name': self.name,
            'passwordHash': self.password_hash,
            'oauthProvider': self.oauth_provider,
            'oauthId': self.oauth_id,
            'createdAt': self.created_at,
            'settings': self.settings
        }
    
    def to_json(self):
        """Convert to JSON-safe dictionary (for API responses)"""
        return {
            'id': str(self._id) if hasattr(self, '_id') else None,
            'email': self.email,
            'name': self.name,
            'oauthProvider': self.oauth_provider,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'settings': self.settings
        }
    
    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password, password_hash):
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def from_dict(data):
        """Create User instance from dictionary"""
        user = User(
            email=data.get('email'),
            name=data.get('name'),
            password_hash=data.get('passwordHash'),
            oauth_provider=data.get('oauthProvider'),
            oauth_id=data.get('oauthId')
        )
        
        if '_id' in data:
            user._id = data['_id']
        if 'createdAt' in data:
            user.created_at = data['createdAt']
        if 'settings' in data:
            user.settings = data['settings']
        
        return user