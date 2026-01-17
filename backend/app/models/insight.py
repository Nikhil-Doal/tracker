from datetime import datetime
from bson import ObjectId


class Insight:
    """AI-generated insight model"""
    
    def __init__(self, user_id, date, insights):
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        self.date = date if isinstance(date, datetime) else datetime.fromisoformat(date)
        self.insights = insights  # List of insight objects
        self.generated_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary for MongoDB"""
        return {
            'userId': self.user_id,
            'date': self.date,
            'insights': self.insights,
            'generatedAt': self.generated_at
        }
    
    def to_json(self):
        """Convert to JSON-safe dictionary"""
        return {
            'id': str(self._id) if hasattr(self, '_id') else None,
            'userId': str(self.user_id),
            'date': self.date.isoformat() if self.date else None,
            'insights': self.insights,
            'generatedAt': self.generated_at.isoformat() if self.generated_at else None
        }
    
    @staticmethod
    def from_dict(data):
        """Create Insight instance from dictionary"""
        insight = Insight(
            user_id=data.get('userId'),
            date=data.get('date'),
            insights=data.get('insights', [])
        )
        
        if '_id' in data:
            insight._id = data['_id']
        if 'generatedAt' in data:
            insight.generated_at = data['generatedAt']
        
        return insight
    
    @staticmethod
    def create_insight_object(insight_type, content, confidence=0.8):
        """
        Create a single insight object
        
        Types: 'pattern', 'recommendation', 'summary', 'alert'
        """
        return {
            'type': insight_type,
            'content': content,
            'confidence': confidence,
            'timestamp': datetime.utcnow()
        }