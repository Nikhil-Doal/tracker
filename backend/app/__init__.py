from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from .config import config

# Global variables
mongo_client = None
db = None
jwt = JWTManager()


def create_app(config_name='default'):
    """Application factory pattern"""
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    jwt.init_app(app)
    
    # Initialize MongoDB
    init_db(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    return app


def init_db(app):
    """Initialize MongoDB connection"""
    global mongo_client, db
    
    try:
        mongo_client = MongoClient(
            app.config['MONGODB_URI'],
            serverSelectionTimeoutMS=5000
        )
        
        # Test connection
        mongo_client.server_info()
        
        db = mongo_client[app.config['MONGODB_DB_NAME']]
        
        # Create indexes
        create_indexes(db)
        
        app.logger.info(f"Connected to MongoDB: {app.config['MONGODB_DB_NAME']}")
        
    except Exception as e:
        app.logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise


def create_indexes(db):
    """Create database indexes for better query performance"""
    
    # Users collection indexes
    db.users.create_index('email', unique=True)
    
    # Events collection indexes
    db.events.create_index([('userId', 1), ('timestamp', -1)])
    db.events.create_index('timestamp')
    db.events.create_index('type')
    db.events.create_index('domain')
    
    # Sessions collection indexes
    db.sessions.create_index([('userId', 1), ('startTime', -1)])
    db.sessions.create_index('domain')
    
    # Insights collection indexes
    db.insights.create_index([('userId', 1), ('date', -1)])


def register_blueprints(app):
    """Register Flask blueprints"""
    
    from app.auth.routes import auth_bp
    from app.events.routes import events_bp
    from app.analytics.routes import analytics_bp
    from app.ai.routes import ai_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')


def register_error_handlers(app):
    """Register error handlers"""
    
    from flask import jsonify
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found', 'message': 'The requested resource was not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error', 'message': 'An unexpected error occurred'}), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400


def get_db():
    """Get database instance"""
    return db