# 🗄️ MongoDB Setup Guide

## Quick MongoDB Installation Options

### Option 1: MongoDB Community Server (Recommended)
1. Download from: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start MongoDB service
4. Run: `node start-simple.js`

### Option 2: MongoDB Atlas (Cloud - Free)
1. Go to: https://www.mongodb.com/atlas
2. Create a free account
3. Create a free cluster
4. Get connection string
5. Set environment variable: `MONGODB_URI=your-atlas-connection-string`
6. Run: `node start-simple.js`

### Option 3: Docker (If you have Docker)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
node start-simple.js
```

### Option 4: No Database (Frontend Only)
```bash
node start-no-db.js
```
This will start the frontend but backend will show connection errors.

## 🚀 Quick Start Commands

### With MongoDB Installed:
```bash
node start-simple.js
```

### Without MongoDB (Frontend Only):
```bash
node start-no-db.js
```

### With Memory Database:
```bash
node start-system-memory.js
```

## 🔧 Troubleshooting

### If MongoDB Connection Fails:
1. Make sure MongoDB is running: `mongod --version`
2. Check if port 27017 is available
3. Try using MongoDB Atlas (cloud)
4. Use the no-database version for frontend testing

### If Frontend Fails:
1. Make sure you're in the project root
2. Try: `cd client && npm start`
3. Check if port 3000 is available

## ✅ System Status
- **Backend**: Requires MongoDB
- **Frontend**: Works independently
- **Full System**: Needs MongoDB + Backend + Frontend
