from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from bson import ObjectId
from app import get_db

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    """Get comprehensive dashboard data"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        # Get date range (default: last 7 days)
        days = int(request.args.get('days', 7))
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        user_id = ObjectId(current_user_id)
        
        # Total events
        total_events = db.events.count_documents({
            'userId': user_id,
            'timestamp': {'$gte': start_date, '$lte': end_date}
        })
        
        # Events by day
        daily_pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    'timestamp': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$timestamp'
                        }
                    },
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        daily_events = list(db.events.aggregate(daily_pipeline))
        
        # Top domains
        domain_pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    'timestamp': {'$gte': start_date, '$lte': end_date},
                    'domain': {'$ne': None}
                }
            },
            {
                '$group': {
                    '_id': '$domain',
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        
        top_domains = list(db.events.aggregate(domain_pipeline))
        
        # Event types distribution
        type_pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    'timestamp': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': '$type',
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'count': -1}}
        ]
        
        event_types = list(db.events.aggregate(type_pipeline))
        
        # Hourly activity (heatmap data)
        hourly_pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    'timestamp': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {'$hour': '$timestamp'},
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        hourly_activity = list(db.events.aggregate(hourly_pipeline))
        
        return jsonify({
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days
            },
            'total_events': total_events,
            'daily_events': [
                {'date': d['_id'], 'count': d['count']}
                for d in daily_events
            ],
            'top_domains': [
                {'domain': d['_id'], 'count': d['count']}
                for d in top_domains
            ],
            'event_types': [
                {'type': t['_id'], 'count': t['count']}
                for t in event_types
            ],
            'hourly_activity': [
                {'hour': h['_id'], 'count': h['count']}
                for h in hourly_activity
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard data', 'message': str(e)}), 500


@analytics_bp.route('/time-spent', methods=['GET'])
@jwt_required()
def get_time_spent():
    """
    Calculate time spent on different domains
    
    This is a simplified calculation based on tab switches.
    For more accurate tracking, you'd need to implement session tracking.
    """
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        # Get date range
        days = int(request.args.get('days', 7))
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        user_id = ObjectId(current_user_id)
        
        # Get all TAB_ACTIVATED and TAB_UPDATED events
        events = list(db.events.find({
            'userId': user_id,
            'type': {'$in': ['TAB_ACTIVATED', 'TAB_UPDATED']},
            'timestamp': {'$gte': start_date, '$lte': end_date},
            'domain': {'$ne': None}
        }).sort('timestamp', 1))
        
        # Calculate time spent per domain
        domain_time = {}
        last_event = None
        
        for event in events:
            if last_event:
                # Calculate time difference (in minutes)
                time_diff = (event['timestamp'] - last_event['timestamp']).total_seconds() / 60
                
                # Only count if less than 30 minutes (assume user was active)
                if time_diff < 30:
                    domain = last_event.get('domain')
                    if domain:
                        domain_time[domain] = domain_time.get(domain, 0) + time_diff
            
            last_event = event
        
        # Convert to list and sort
        time_spent = [
            {
                'domain': domain,
                'minutes': round(minutes, 2),
                'hours': round(minutes / 60, 2)
            }
            for domain, minutes in domain_time.items()
        ]
        
        time_spent.sort(key=lambda x: x['minutes'], reverse=True)
        
        return jsonify({
            'time_spent': time_spent[:20],  # Top 20 domains
            'total_minutes': round(sum(domain_time.values()), 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to calculate time spent', 'message': str(e)}), 500


@analytics_bp.route('/productivity', methods=['GET'])
@jwt_required()
def get_productivity_score():
    """
    Calculate productivity score based on domain categorization
    
    This is a simple implementation. You can enhance it with:
    - Custom user categories
    - Machine learning classification
    - Time-of-day analysis
    """
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        days = int(request.args.get('days', 7))
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Simple domain categorization
        productive_domains = [
            'github.com', 'stackoverflow.com', 'docs.python.org',
            'developer.mozilla.org', 'aws.amazon.com', 'cloud.google.com',
            'notion.so', 'trello.com', 'asana.com', 'linkedin.com'
        ]
        
        social_domains = [
            'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
            'reddit.com', 'youtube.com', 'twitch.tv'
        ]
        
        user_id = ObjectId(current_user_id)
        
        # Count events by category
        productive_count = db.events.count_documents({
            'userId': user_id,
            'timestamp': {'$gte': start_date, '$lte': end_date},
            'domain': {'$in': productive_domains}
        })
        
        social_count = db.events.count_documents({
            'userId': user_id,
            'timestamp': {'$gte': start_date, '$lte': end_date},
            'domain': {'$in': social_domains}
        })
        
        total_count = db.events.count_documents({
            'userId': user_id,
            'timestamp': {'$gte': start_date, '$lte': end_date},
            'domain': {'$ne': None}
        })
        
        # Calculate score (0-100)
        if total_count == 0:
            score = 0
        else:
            productive_ratio = productive_count / total_count
            social_ratio = social_count / total_count
            score = round((productive_ratio * 100) - (social_ratio * 25), 2)
            score = max(0, min(100, score))  # Clamp between 0-100
        
        return jsonify({
            'score': score,
            'productive_events': productive_count,
            'social_events': social_count,
            'total_events': total_count,
            'productive_percentage': round((productive_count / total_count * 100), 2) if total_count > 0 else 0,
            'social_percentage': round((social_count / total_count * 100), 2) if total_count > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to calculate productivity', 'message': str(e)}), 500


@analytics_bp.route('/patterns', methods=['GET'])
@jwt_required()
def get_usage_patterns():
    """Identify usage patterns"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        days = int(request.args.get('days', 30))
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        user_id = ObjectId(current_user_id)
        
        # Most active hour
        hour_pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    'timestamp': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {'$hour': '$timestamp'},
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'count': -1}},
            {'$limit': 1}
        ]
        
        most_active_hour = list(db.events.aggregate(hour_pipeline))
        
        # Most active day of week
        dow_pipeline = [
            {
                '$match': {
                    'userId': user_id,
                    'timestamp': {'$gte': start_date, '$lte': end_date}
                }
            },
            {
                '$group': {
                    '_id': {'$dayOfWeek': '$timestamp'},
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'count': -1}},
            {'$limit': 1}
        ]
        
        most_active_day = list(db.events.aggregate(dow_pipeline))
        
        # Day of week mapping
        days_map = {1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday', 
                    5: 'Thursday', 6: 'Friday', 7: 'Saturday'}
        
        return jsonify({
            'most_active_hour': most_active_hour[0]['_id'] if most_active_hour else None,
            'most_active_day': days_map.get(most_active_day[0]['_id']) if most_active_day else None,
            'patterns': {
                'peak_hour': most_active_hour[0] if most_active_hour else None,
                'peak_day': most_active_day[0] if most_active_day else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get patterns', 'message': str(e)}), 500