# 🚀 Browser Telemetry Tracker - Backend API

Flask-based REST API for browser telemetry tracking with MongoDB and AI-powered insights.

## 📦 Features

- ✅ **JWT Authentication** - Secure user authentication with access/refresh tokens
- ✅ **Event Sync** - Receive and store browser events from extension
- ✅ **Analytics** - Comprehensive analytics and reporting
- ✅ **AI Insights** - Gemini AI-powered productivity insights
- ✅ **MongoDB** - Scalable NoSQL database
- ✅ **RESTful API** - Clean, documented API endpoints
- ✅ **CORS Support** - Ready for frontend integration

---

## 🛠️ Tech Stack

- **Flask** 3.0.0 - Web framework
- **MongoDB** - Database (local or Atlas)
- **PyMongo** - MongoDB driver
- **Flask-JWT-Extended** - JWT authentication
- **Gemini AI** - AI insights generation
- **Bcrypt** - Password hashing
- **Marshmallow** - Data validation

---

## 📋 Prerequisites

- Python 3.8+
- MongoDB (local or MongoDB Atlas account)
- Google Gemini API key (optional, for AI features)

---

## 🚀 Quick Start

### 1. Clone & Navigate

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
# Required: MONGODB_URI, SECRET_KEY, JWT_SECRET_KEY
# Optional: GEMINI_API_KEY
```

### 5. Set Up MongoDB

**Option A: Local MongoDB**

```bash
# Make sure MongoDB is running
mongod --dbpath /path/to/data/db
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 6. Run the Server

```bash
python run.py
```

Server starts at: `http://localhost:5000`

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": { ... },
  "access_token": "...",
  "refresh_token": "..."
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

---

### Event Endpoints

#### Sync Events (from extension)

```http
POST /api/events/sync
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "events": [
    {
      "_id": "uuid",
      "v": 1,
      "type": "TAB_ACTIVATED",
      "ts": 1705123456789,
      "payload": { ... }
    }
  ]
}
```

#### Get Events

```http
GET /api/events/?start_date=2024-01-01&end_date=2024-01-31&limit=100
Authorization: Bearer <access_token>
```

#### Get Event Count

```http
GET /api/events/count
Authorization: Bearer <access_token>
```

#### Get Top Domains

```http
GET /api/events/domains?limit=10
Authorization: Bearer <access_token>
```

---

### Analytics Endpoints

#### Get Dashboard Data

```http
GET /api/analytics/dashboard?days=7
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "total_events": 1234,
  "daily_events": [...],
  "top_domains": [...],
  "event_types": [...],
  "hourly_activity": [...]
}
```

#### Get Time Spent Analysis

```http
GET /api/analytics/time-spent?days=7
Authorization: Bearer <access_token>
```

#### Get Productivity Score

```http
GET /api/analytics/productivity?days=7
Authorization: Bearer <access_token>
```

---

### AI Insights Endpoints

#### Generate Daily Summary

```http
GET /api/ai/daily-summary?date=2024-01-15
Authorization: Bearer <access_token>
```

#### Get Productivity Insights

```http
GET /api/ai/productivity-insights?days=7
Authorization: Bearer <access_token>
```

#### Generate Weekly Report

```http
GET /api/ai/weekly-report
Authorization: Bearer <access_token>
```

---

## 🗄️ Database Schema

### Users Collection

```javascript
{
  "_id": ObjectId,
  "email": String,
  "name": String,
  "passwordHash": String,
  "oauthProvider": String (optional),
  "oauthId": String (optional),
  "createdAt": ISODate,
  "settings": {
    "sync_interval": Number,
    "categorization": Object
  }
}
```

### Events Collection

```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,
  "type": String,  // TAB_ACTIVATED, TAB_UPDATED, etc.
  "timestamp": ISODate,
  "domain": String,
  "tabId": Number,
  "windowId": Number,
  "url": String,
  "title": String,
  "payload": Object
}
```

### Insights Collection

```javascript
{
  "_id": ObjectId,
  "userId": ObjectId,
  "date": ISODate,
  "insights": Array,
  "generatedAt": ISODate
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Flask
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FLASK_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=browser_telemetry

# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/

# JWT
JWT_ACCESS_TOKEN_EXPIRES=3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES=2592000  # 30 days

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# AI
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=5000
DEBUG=True
```

---

## 🧪 Testing

### Test with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test User","password":"test1234"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'

# Get current user
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test with Postman

1. Import the API endpoints
2. Set up environment variables
3. Test each endpoint

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py          # App factory
│   ├── config.py            # Configuration
│   ├── models/              # Database models
│   │   ├── user.py
│   │   ├── event.py
│   │   └── insight.py
│   ├── auth/                # Authentication
│   │   └── routes.py
│   ├── events/              # Event handling
│   │   └── routes.py
│   ├── analytics/           # Analytics
│   │   └── routes.py
│   └── ai/                  # AI insights
│       ├── gemini.py
│       └── routes.py
├── requirements.txt         # Dependencies
├── .env.example            # Environment template
├── .gitignore              # Git ignore
├── run.py                  # Entry point
└── README.md               # This file
```

---

## 🔐 Security

- Passwords hashed with bcrypt
- JWT token authentication
- CORS configured
- Input validation with Marshmallow
- MongoDB injection prevention
- Environment variables for secrets

---

## 🚀 Deployment

### Using Gunicorn (Production)

```bash
# Install gunicorn (included in requirements.txt)
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
mongod --version

# Test connection
mongo --eval "db.version()"
```

### Port Already in Use

```bash
# Change PORT in .env
PORT=5001
```

### Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

---

## 📝 Next Steps

1. ✅ Backend is complete
2. 🔄 Connect extension to backend (update URLs)
3. 🎨 Build Next.js frontend
4. 🤖 Configure Gemini AI API key
5. 🚀 Deploy to production

---

## 🤝 Contributing

This is a personal project, but feel free to fork and modify!

---

## 📄 License

MIT License - feel free to use for your own projects!

---

**Ready to run!** Start the server with `python run.py` 🚀
