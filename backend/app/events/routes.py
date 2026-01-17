from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from bson import ObjectId
from app.models.event import Event
from app import get_db

events_bp = Blueprint('events', __name__)


@events_bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_events():
    """Sync events from browser extension"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        print("\n" + "="*60)
        print(f"[SYNC] Received request from user: {current_user_id}")
        print(f"[SYNC] Data type: {type(data)}")
        if data:
            print(f"[SYNC] Keys: {list(data.keys())}")
        print("="*60)
        
        if not data:
            print("[SYNC ERROR] No data in request")
            return jsonify({'error': 'No data provided'}), 400
            
        if 'events' not in data:
            print(f"[SYNC ERROR] No 'events' key. Available keys: {list(data.keys())}")
            return jsonify({'error': 'No events provided'}), 400
        
        events = data['events']
        print(f"[SYNC] Processing {len(events)} events")
        
        if not isinstance(events, list):
            print(f"[SYNC ERROR] Events is not a list: {type(events)}")
            return jsonify({'error': 'Events must be an array'}), 400
        
        if len(events) > 0:
            print(f"[SYNC] Sample event: {events[0]}")
        
        db = get_db()
        event_documents = []
        errors = []
        
        for i, ext_event in enumerate(events):
            try:
                # Simple direct conversion
                timestamp = ext_event.get('ts', 0)
                if timestamp:
                    timestamp = datetime.fromtimestamp(timestamp / 1000)
                else:
                    timestamp = datetime.utcnow()
                
                event_doc = {
                    'userId': ObjectId(current_user_id),
                    'type': ext_event.get('type', 'UNKNOWN'),
                    'timestamp': timestamp,
                    'payload': ext_event.get('payload', {}),
                    'windowId': ext_event.get('payload', {}).get('windowId'),
                    'tabId': ext_event.get('payload', {}).get('tabId'),
                    'url': ext_event.get('payload', {}).get('url'),
                    'title': ext_event.get('payload', {}).get('title'),
                }
                event_documents.append(event_doc)
                
            except Exception as e:
                error_msg = f"Event {i+1} failed: {str(e)}"
                print(f"[SYNC ERROR] {error_msg}")
                errors.append(error_msg)
        
        if not event_documents:
            print(f"[SYNC ERROR] No valid events. Errors: {errors}")
            return jsonify({'error': 'No valid events', 'details': errors}), 400
        
        print(f"[SYNC] Inserting {len(event_documents)} events into DB...")
        result = db.events.insert_many(event_documents)
        print(f"[SYNC SUCCESS] ✅ Inserted {len(result.inserted_ids)} events")
        
        return jsonify({
            'success': True,
            'message': 'Events synced successfully',
            'received': len(events),
            'inserted': len(result.inserted_ids)
        }), 200
        
    except Exception as e:
        print(f"[SYNC CRITICAL ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Sync failed', 'message': str(e)}), 500


@events_bp.route('/', methods=['GET'])
@jwt_required()
def get_events():
    """Get events for current user with optional filters"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        query = {'userId': ObjectId(current_user_id)}
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date or end_date:
            query['timestamp'] = {}
            if start_date:
                query['timestamp']['$gte'] = datetime.fromisoformat(start_date)
            if end_date:
                query['timestamp']['$lte'] = datetime.fromisoformat(end_date)
        
        event_type = request.args.get('type')
        if event_type:
            query['type'] = event_type
        
        domain = request.args.get('domain')
        if domain:
            query['domain'] = domain
        
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        
        events = list(db.events.find(query)
                     .sort('timestamp', -1)
                     .limit(limit)
                     .skip(skip))
        
        total = db.events.count_documents(query)
        
        events_json = [Event.from_dict(e).to_json() for e in events]
        
        return jsonify({
            'events': events_json,
            'total': total,
            'limit': limit,
            'skip': skip
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get events', 'message': str(e)}), 500


@events_bp.route('/count', methods=['GET'])
@jwt_required()
def get_event_count():
    """Get total event count for current user"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        count = db.events.count_documents({'userId': ObjectId(current_user_id)})
        
        return jsonify({'count': count}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get count', 'message': str(e)}), 500


@events_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_events():
    """Get recent events (last 24 hours by default)"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        hours = int(request.args.get('hours', 24))
        limit = int(request.args.get('limit', 50))
        
        threshold = datetime.utcnow() - timedelta(hours=hours)
        
        events = list(db.events.find({
            'userId': ObjectId(current_user_id),
            'timestamp': {'$gte': threshold}
        }).sort('timestamp', -1).limit(limit))
        
        events_json = [Event.from_dict(e).to_json() for e in events]
        
        return jsonify({
            'events': events_json,
            'hours': hours,
            'count': len(events_json)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get recent events', 'message': str(e)}), 500


@events_bp.route('/domains', methods=['GET'])
@jwt_required()
def get_top_domains():
    """Get top visited domains"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        limit = int(request.args.get('limit', 10))
        
        pipeline = [
            {'$match': {
                'userId': ObjectId(current_user_id),
                'domain': {'$ne': None}
            }},
            {'$group': {
                '_id': '$domain',
                'count': {'$sum': 1},
                'lastVisit': {'$max': '$timestamp'}
            }},
            {'$sort': {'count': -1}},
            {'$limit': limit}
        ]
        
        results = list(db.events.aggregate(pipeline))
        
        domains = [
            {
                'domain': r['_id'],
                'count': r['count'],
                'lastVisit': r['lastVisit'].isoformat() if r['lastVisit'] else None
            }
            for r in results
        ]
        
        return jsonify({
            'domains': domains,
            'total': len(domains)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get domains', 'message': str(e)}), 500


@events_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_event_stats():
    """Get event statistics"""
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        match_query = {'userId': ObjectId(current_user_id)}
        
        if start_date or end_date:
            match_query['timestamp'] = {}
            if start_date:
                match_query['timestamp']['$gte'] = datetime.fromisoformat(start_date)
            if end_date:
                match_query['timestamp']['$lte'] = datetime.fromisoformat(end_date)
        
        pipeline = [
            {'$match': match_query},
            {'$group': {
                '_id': '$type',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}}
        ]
        
        type_stats = list(db.events.aggregate(pipeline))
        
        total = db.events.count_documents(match_query)
        
        return jsonify({
            'total': total,
            'by_type': [
                {'type': s['_id'], 'count': s['count']}
                for s in type_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get stats', 'message': str(e)}), 500