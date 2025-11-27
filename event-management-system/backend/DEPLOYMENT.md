# 🚀 Production Deployment Guide

## Overview

This guide covers deploying the Event Management System to production environments.

## Deployment Options

### Option 1: Heroku (Recommended for Beginners)

#### Prerequisites
- Heroku account ([Sign up](https://signup.heroku.com/))
- Heroku CLI installed

#### Backend Deployment

1. **Login to Heroku**
```powershell
heroku login
```

2. **Create Heroku App**
```powershell
cd backend
heroku create school-event-management-api
```

3. **Set Environment Variables**
```powershell
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-production-jwt-secret"
heroku config:set MONGODB_URI="your-mongodb-atlas-uri"
heroku config:set FIREBASE_PROJECT_ID="your-project-id"
heroku config:set FIREBASE_PRIVATE_KEY="your-private-key"
heroku config:set FIREBASE_CLIENT_EMAIL="your-client-email"
heroku config:set FIREBASE_DATABASE_URL="your-database-url"
heroku config:set CLIENT_URL="https://your-frontend-domain.com"
```

4. **Deploy**
```powershell
git init
git add .
git commit -m "Initial deployment"
heroku git:remote -a school-event-management-api
git push heroku main
```

5. **Verify Deployment**
```powershell
heroku logs --tail
heroku open
```

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
```powershell
npm install -g vercel
```

2. **Deploy**
```powershell
cd ..\frontend
vercel
```

3. **Set Environment Variables in Vercel Dashboard**
- Go to your project settings
- Add all `REACT_APP_*` variables
- Update `REACT_APP_API_URL` to your Heroku backend URL
- Update `REACT_APP_SOCKET_URL` to your Heroku backend URL

4. **Deploy to Production**
```powershell
vercel --prod
```

### Option 2: AWS (Production Grade)

#### Backend on AWS Elastic Beanstalk

1. **Install EB CLI**
```powershell
pip install awsebcli
```

2. **Initialize EB**
```powershell
cd backend
eb init -p node.js school-event-api --region us-east-1
```

3. **Create Environment**
```powershell
eb create production-env
```

4. **Set Environment Variables**
```powershell
eb setenv NODE_ENV=production JWT_SECRET=xxx MONGODB_URI=xxx ...
```

5. **Deploy**
```powershell
eb deploy
```

#### Frontend on AWS S3 + CloudFront

1. **Build Frontend**
```powershell
cd frontend
npm run build
```

2. **Create S3 Bucket**
```powershell
aws s3 mb s3://school-event-management-frontend
```

3. **Enable Static Website Hosting**
```powershell
aws s3 website s3://school-event-management-frontend --index-document index.html --error-document index.html
```

4. **Upload Build**
```powershell
aws s3 sync build/ s3://school-event-management-frontend --delete
```

5. **Set Bucket Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::school-event-management-frontend/*"
    }
  ]
}
```

6. **Create CloudFront Distribution**
- Origin: S3 bucket endpoint
- Default cache behavior: Redirect HTTP to HTTPS
- Price class: Use only North America and Europe
- Alternate domain names: your-domain.com

### Option 3: DigitalOcean (Balanced)

#### Deploy Backend

1. **Create Droplet**
- Ubuntu 22.04 LTS
- At least 2GB RAM
- Enable monitoring

2. **SSH into Droplet**
```bash
ssh root@your-droplet-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install MongoDB**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

5. **Clone and Setup**
```bash
git clone https://github.com/your-repo/event-management-system.git
cd event-management-system/backend
npm install --production
```

6. **Configure Environment**
```bash
nano .env
# Add all production variables
```

7. **Install PM2**
```bash
npm install -g pm2
pm2 start server.js --name event-api
pm2 save
pm2 startup
```

8. **Setup Nginx Reverse Proxy**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/event-api
```

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/event-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **SSL Certificate**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

## Database Migration

### MongoDB Atlas (Recommended)

1. **Create Cluster**
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create free tier cluster
- Choose region closest to your users

2. **Configure Network Access**
- Whitelist IP: `0.0.0.0/0` (all IPs) for development
- For production, whitelist specific IPs

3. **Create Database User**
- Username: `event-admin`
- Password: Generate secure password
- Permissions: Read and write to any database

4. **Get Connection String**
```
mongodb+srv://event-admin:password@cluster0.xxxxx.mongodb.net/event-management?retryWrites=true&w=majority
```

5. **Migrate Data**
```powershell
# Export from local
mongodump --db event-management --out ./backup

# Import to Atlas
mongorestore --uri "mongodb+srv://username:password@cluster.mongodb.net/event-management" ./backup/event-management
```

## Firebase Production Configuration

### 1. Security Rules

Update Realtime Database rules:

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        ".write": "auth != null",
        "liveUpdates": {
          ".indexOn": ["timestamp"],
          ".write": "auth != null && (root.child('events/' + $eventId + '/organizer/userId').val() === auth.uid || auth.token.admin === true)"
        }
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null && (auth.uid === $userId || auth.token.admin === true)",
        ".write": "auth != null && auth.uid === $userId"
      }
    }
  }
}
```

### 2. Cloud Messaging Configuration

1. Add authorized domains in Firebase Console
2. Update VAPID key for web push
3. Set up server key for backend

### 3. Performance Optimization

- Enable Firebase Performance Monitoring
- Set up indexes for frequently queried data
- Configure caching rules

## Performance Optimization

### Backend

1. **Enable Compression**
```javascript
// In server.js
const compression = require('compression');
app.use(compression());
```

2. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

3. **MongoDB Indexes**
```javascript
// In models/Event.js
EventSchema.index({ startDate: 1, category: 1 });
EventSchema.index({ status: 1, visibility: 1 });
EventSchema.index({ 'organizer.userId': 1 });
```

4. **Enable Clustering**
```javascript
// cluster.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const cpuCount = os.cpus().length;
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }
} else {
  require('./server.js');
}
```

### Frontend

1. **Code Splitting**
```javascript
// App.js
const EventDetail = React.lazy(() => import('./components/EventDetail'));
const Calendar = React.lazy(() => import('./components/Calendar'));

<Suspense fallback={<Loading />}>
  <Route path="/event/:id" element={<EventDetail />} />
</Suspense>
```

2. **Image Optimization**
- Use WebP format
- Implement lazy loading
- Add CDN for static assets

3. **Service Worker**
```javascript
// service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll(['/','/ static/css/main.css', '/static/js/main.js']);
    })
  );
});
```

## Monitoring & Logging

### 1. Error Tracking (Sentry)

```javascript
// Backend
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-sentry-dsn' });

// Frontend
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: 'your-sentry-dsn' });
```

### 2. Application Monitoring

```javascript
// Backend - PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. Analytics

```javascript
// Frontend - Google Analytics
import ReactGA from 'react-ga4';
ReactGA.initialize('G-XXXXXXXXXX');
```

## Security Checklist

- [ ] Use HTTPS everywhere (SSL certificate)
- [ ] Set secure HTTP headers (helmet.js)
- [ ] Enable CORS with specific origins
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Keep dependencies updated
- [ ] Use strong JWT secrets
- [ ] Hash passwords with bcrypt (salt rounds ≥ 10)
- [ ] Sanitize database queries
- [ ] Enable MongoDB authentication
- [ ] Set up Firebase security rules
- [ ] Regular security audits
- [ ] Implement CSP headers

## Backup Strategy

### Automated MongoDB Backups

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/$DATE"
find /backups -type d -mtime +7 -exec rm -rf {} +
```

```bash
# Crontab - Daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## Scaling Strategy

### Horizontal Scaling

1. **Load Balancer** (Nginx/AWS ELB)
```nginx
upstream backend {
    server server1:5000;
    server server2:5000;
    server server3:5000;
}
```

2. **Socket.IO Adapter** (Redis)
```javascript
const redis = require('socket.io-redis');
io.adapter(redis({ host: 'localhost', port: 6379 }));
```

3. **Database Sharding**
- Shard by event category or date
- Use MongoDB sharding for large datasets

## Post-Deployment

1. **Test Everything**
   - Registration and login
   - Creating events
   - RSVP functionality
   - Live updates
   - Push notifications
   - Calendar view

2. **Monitor Performance**
   - Server response times
   - Database query performance
   - WebSocket connections
   - Error rates

3. **Set Up Alerts**
   - Server down alerts
   - High error rate alerts
   - Database connection issues
   - Disk space warnings

## Rollback Plan

```powershell
# Heroku
heroku releases
heroku rollback v123

# PM2
pm2 list
pm2 reload all
pm2 restart event-api
```

---

**Your application is now production-ready! 🚀**
