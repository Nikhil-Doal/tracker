#!/usr/bin/env python3
"""
Flask Application Entry Point
"""
import os
from app import create_app

# Get configuration from environment
config_name = os.getenv('FLASK_ENV', 'development')

# Create Flask application
app = create_app(config_name)

if __name__ == '__main__':
    host = app.config.get('HOST', '0.0.0.0')
    port = app.config.get('PORT', 5000)
    debug = app.config.get('DEBUG', True)
    
    print(f"""
    ╔═══════════════════════════════════════════════════╗
    ║   Browser Telemetry Tracker - Backend API        ║
    ╚═══════════════════════════════════════════════════╝
    
    🚀 Server starting...
    
    📍 URL: http://{host}:{port}
    🔧 Environment: {config_name}
    🐛 Debug: {debug}
    
    📚 API Documentation:
    
    Authentication:
    • POST   /api/auth/register      - Register new user
    • POST   /api/auth/login         - Login user
    • POST   /api/auth/refresh       - Refresh token
    • GET    /api/auth/me            - Get current user
    • POST   /api/auth/logout        - Logout user
    
    Events:
    • POST   /api/events/sync        - Sync events from extension
    • GET    /api/events/            - Get events (with filters)
    • GET    /api/events/count       - Get event count
    • GET    /api/events/recent      - Get recent events
    • GET    /api/events/domains     - Get top domains
    • GET    /api/events/stats       - Get event statistics
    
    Analytics:
    • GET    /api/analytics/dashboard         - Get dashboard data
    • GET    /api/analytics/time-spent        - Calculate time spent
    • GET    /api/analytics/productivity      - Get productivity score
    • GET    /api/analytics/patterns          - Get usage patterns
    
    AI Insights:
    • GET    /api/ai/daily-summary            - Generate daily summary
    • GET    /api/ai/productivity-insights    - Get productivity insights
    • POST   /api/ai/categorize               - Categorize domain
    • GET    /api/ai/weekly-report            - Generate weekly report
    • GET    /api/ai/insights/history         - Get insights history
    
    ═══════════════════════════════════════════════════
    """)
    
    app.run(host=host, port=port, debug=debug)