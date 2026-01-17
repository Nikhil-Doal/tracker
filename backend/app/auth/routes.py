from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from marshmallow import Schema, fields, ValidationError
from app.models.user import User
from app import get_db

auth_bp = Blueprint('auth', __name__)


# Validation Schemas
class RegisterSchema(Schema):
    email = fields.Email(required=True)
    name = fields.Str(required=True)
    password = fields.Str(required=True, validate=lambda p: len(p) >= 8)


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


# Routes
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Validate request data
        schema = RegisterSchema()
        data = schema.load(request.json)
        
        db = get_db()
        
        # Check if user already exists
        existing_user = db.users.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            name=data['name'],
            password_hash=User.hash_password(data['password'])
        )
        
        # Insert into database
        result = db.users.insert_one(user.to_dict())
        user._id = result.inserted_id
        
        # Create tokens
        access_token = create_access_token(identity=str(user._id))
        refresh_token = create_refresh_token(identity=str(user._id))
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_json(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'messages': err.messages}), 400
    except Exception as e:
        return jsonify({'error': 'Registration failed', 'message': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        # Validate request data
        schema = LoginSchema()
        data = schema.load(request.json)
        
        db = get_db()
        
        # Find user
        user_data = db.users.find_one({'email': data['email']})
        if not user_data:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        user = User.from_dict(user_data)
        
        # Verify password
        if not user.password_hash or not User.verify_password(data['password'], user.password_hash):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create tokens
        access_token = create_access_token(identity=str(user._id))
        refresh_token = create_refresh_token(identity=str(user._id))
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_json(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'messages': err.messages}), 400
    except Exception as e:
        return jsonify({'error': 'Login failed', 'message': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Token refresh failed', 'message': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        from bson import ObjectId
        user_data = db.users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        user = User.from_dict(user_data)
        
        return jsonify({
            'user': user.to_json()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get user', 'message': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    # In a production app, you might want to blacklist the token
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        data = request.json
        update_fields = {}
        
        # Only allow updating certain fields
        if 'name' in data:
            update_fields['name'] = data['name']
        if 'settings' in data:
            update_fields['settings'] = data['settings']
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        from bson import ObjectId
        result = db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': update_fields}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'No changes made'}), 400
        
        # Get updated user
        user_data = db.users.find_one({'_id': ObjectId(current_user_id)})
        user = User.from_dict(user_data)
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_json()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Update failed', 'message': str(e)}), 500