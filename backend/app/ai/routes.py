from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from bson import ObjectId
from app import get_db
from app.ai.gemini import get_gemini_ai
from app.models.insight import Insight

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/daily-summary', methods=['GET'])
@jwt_required()
def generate_daily_summary():
    """Generate AI summary for a specific day"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        # Get date parameter (default: today)
        date_str = request.args.get('date')
        if date_str:
            target_date = datetime.fromisoformat(date_str).date()
        else:
            target_date = datetime.utcnow().date()
        
        # Get events for that day
        start_time = datetime.combine(target_date, datetime.min.time())
        end_time = datetime.combine(target_date, datetime.max.time())
        
        events = list(db.events.find({
            'userId': ObjectId(current_user_id),
            'timestamp': {'$gte': start_time, '$lte': end_time}
        }))
        
        if not events:
            return jsonify({
                'summary': 'No activity recorded for this day.',
                'date': target_date.isoformat()
            }), 200
        
        # Prepare event data for AI
        events_data = [
            {
                'type': e.get('type'),
                'domain': e.get('domain'),
                'timestamp': e.get('timestamp').isoformat() if e.get('timestamp') else None
            }
            for e in events
        ]
        
        # Generate summary using Gemini
        ai = get_gemini_ai()
        summary = ai.generate_daily_summary(events_data)
        
        # Store insight
        insight = Insight(
            user_id=current_user_id,
            date=start_time,
            insights=[
                Insight.create_insight_object('summary', summary, confidence=0.85)
            ]
        )
        
        db.insights.insert_one(insight.to_dict())
        
        return jsonify({
            'summary': summary,
            'date': target_date.isoformat(),
            'event_count': len(events)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate summary', 'message': str(e)}), 500


@ai_bp.route('/productivity-insights', methods=['GET'])
@jwt_required()
def generate_productivity_insights():
    """Generate AI insights about productivity"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        # Get date range
        days = int(request.args.get('days', 7))
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        user_id = ObjectId(current_user_id)
        
        # Calculate time spent (simplified version)
        events = list(db.events.find({
            'userId': user_id,
            'type': {'$in': ['TAB_ACTIVATED', 'TAB_UPDATED']},
            'timestamp': {'$gte': start_date, '$lte': end_date},
            'domain': {'$ne': None}
        }).sort('timestamp', 1))
        
        # Calculate time per domain
        domain_time = {}
        last_event = None
        
        for event in events:
            if last_event:
                time_diff = (event['timestamp'] - last_event['timestamp']).total_seconds() / 60
                if time_diff < 30:
                    domain = last_event.get('domain')
                    if domain:
                        domain_time[domain] = domain_time.get(domain, 0) + time_diff
            last_event = event
        
        # Calculate productivity score (simplified)
        productive_domains = ['github.com', 'stackoverflow.com', 'docs.python.org']
        social_domains = ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com']
        
        productive_time = sum(time for domain, time in domain_time.items() if any(pd in domain for pd in productive_domains))
        social_time = sum(time for domain, time in domain_time.items() if any(sd in domain for sd in social_domains))
        total_time = sum(domain_time.values())
        
        if total_time > 0:
            productivity_score = ((productive_time / total_time) * 100) - ((social_time / total_time) * 25)
            productivity_score = max(0, min(100, productivity_score))
        else:
            productivity_score = 0
        
        # Generate insights using Gemini
        ai = get_gemini_ai()
        insights_text = ai.generate_productivity_insights(domain_time, productivity_score)
        
        return jsonify({
            'insights': insights_text,
            'productivity_score': round(productivity_score, 2),
            'time_spent': {
                'total_minutes': round(total_time, 2),
                'productive_minutes': round(productive_time, 2),
                'social_minutes': round(social_time, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate insights', 'message': str(e)}), 500


@ai_bp.route('/categorize', methods=['POST'])
@jwt_required()
def categorize_domain():
    """Categorize a domain using AI"""
    try:
        data = request.json
        
        if not data or 'domain' not in data:
            return jsonify({'error': 'Domain is required'}), 400
        
        domain = data['domain']
        title = data.get('title')
        
        ai = get_gemini_ai()
        category = ai.categorize_domain(domain, title)
        
        return jsonify({
            'domain': domain,
            'category': category
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to categorize', 'message': str(e)}), 500


@ai_bp.route('/weekly-report', methods=['GET'])
@jwt_required()
def generate_weekly_report():
    """Generate comprehensive weekly report"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        # Get last 7 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        user_id = ObjectId(current_user_id)
        
        # Gather analytics data
        total_events = db.events.count_documents({
            'userId': user_id,
            'timestamp': {'$gte': start_date, '$lte': end_date}
        })
        
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
        
        top_domains = [
            {'domain': d['_id'], 'count': d['count']}
            for d in db.events.aggregate(domain_pipeline)
        ]
        
        # Calculate productivity score (simplified)
        productive_count = db.events.count_documents({
            'userId': user_id,
            'timestamp': {'$gte': start_date, '$lte': end_date},
            'domain': {'$regex': 'github|stackoverflow|docs'}
        })
        
        productivity_score = (productive_count / total_events * 100) if total_events > 0 else 0
        
        # Peak activity
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
        
        peak_hour_data = list(db.events.aggregate(hour_pipeline))
        peak_hour = f"{peak_hour_data[0]['_id']}:00" if peak_hour_data else "N/A"
        
        # Prepare data for AI
        weekly_data = {
            'total_events': total_events,
            'top_domains': top_domains,
            'productivity_score': round(productivity_score, 2),
            'peak_hour': peak_hour,
            'peak_day': 'Weekday'  # Simplified
        }
        
        # Generate report using Gemini
        ai = get_gemini_ai()
        report = ai.generate_weekly_report(weekly_data)
        
        # Store insight
        insight = Insight(
            user_id=current_user_id,
            date=start_date,
            insights=[
                Insight.create_insight_object('weekly_report', report, confidence=0.9)
            ]
        )
        
        db.insights.insert_one(insight.to_dict())
        
        return jsonify({
            'report': report,
            'data': weekly_data,
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate report', 'message': str(e)}), 500


@ai_bp.route('/insights/history', methods=['GET'])
@jwt_required()
def get_insights_history():
    """Get historical insights"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        limit = int(request.args.get('limit', 10))
        
        insights = list(db.insights.find({
            'userId': ObjectId(current_user_id)
        }).sort('date', -1).limit(limit))
        
        insights_json = [Insight.from_dict(i).to_json() for i in insights]
        
        return jsonify({
            'insights': insights_json,
            'count': len(insights_json)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get insights', 'message': str(e)}), 500