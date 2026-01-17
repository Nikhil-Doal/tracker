from datetime import datetime
from bson import ObjectId
from urllib.parse import urlparse


class Event:
    """Event model for browser telemetry data"""
    
    def __init__(self, user_id, event_type, timestamp, payload):
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        self.type = event_type
        self.timestamp = datetime.fromtimestamp(timestamp / 1000) if isinstance(timestamp, int) else timestamp
        self.payload = payload
        
        # Extract domain from URL if present
        self.domain = self._extract_domain(payload.get('url'))
        
        # Additional metadata
        self.tab_id = payload.get('tabId')
        self.window_id = payload.get('windowId')
        self.url = payload.get('url')
        self.title = payload.get('title')
    
    def _extract_domain(self, url):
        """Extract domain from URL"""
        if not url:
            return None
        
        try:
            parsed = urlparse(url)
            return parsed.netloc or None
        except:
            return None
    
    def to_dict(self):
        """Convert to dictionary for MongoDB"""
        return {
            'userId': self.user_id,
            'type': self.type,
            'timestamp': self.timestamp,
            'domain': self.domain,
            'tabId': self.tab_id,
            'windowId': self.window_id,
            'url': self.url,
            'title': self.title,
            'payload': self.payload
        }
    
    def to_json(self):
        """Convert to JSON-safe dictionary"""
        return {
            'id': str(self._id) if hasattr(self, '_id') else None,
            'userId': str(self.user_id),
            'type': self.type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'domain': self.domain,
            'tabId': self.tab_id,
            'windowId': self.window_id,
            'url': self.url,
            'title': self.title
        }
    
    @staticmethod
    def from_dict(data):
        """Create Event instance from dictionary"""
        event = Event(
            user_id=data.get('userId'),
            event_type=data.get('type'),
            timestamp=data.get('timestamp'),
            payload=data.get('payload', {})
        )
        
        if '_id' in data:
            event._id = data['_id']
        
        return event
    
    @staticmethod
    def from_extension_payload(user_id, extension_event):
        """
        Create Event from extension payload format
        
        Extension sends events in this format:
        {
            "_id": "uuid",
            "v": 1,
            "type": "TAB_ACTIVATED",
            "ts": 1705123456789,
            "payload": { ... }
        }
        """
        # Get timestamp from either ts or timestamp field
        timestamp = extension_event.get('ts') or extension_event.get('timestamp')
        
        # Get type from either root level or payload
        event_type = extension_event.get('type') or extension_event.get('payload', {}).get('type')
        
        # Get payload - use the whole event as payload if no separate payload field
        payload = extension_event.get('payload', extension_event)
        
        return Event(
            user_id=user_id,
            event_type=event_type,
            timestamp=timestamp,
            payload=payload
        )