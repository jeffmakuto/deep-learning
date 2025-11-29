# Quick Start Guide

## Cloud-Based Integration System

Get the system up and running in 10 minutes!

---

## Prerequisites

- [ ] Node.js v16+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

---

## Step 1: Clone & Navigate

```bash
cd c:\Users\jeff\Projects\deep-learning\cloud_integration_system
```

---

## Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your credentials
notepad .env
```

**Minimal .env configuration for testing:**
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Use placeholder values for testing
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
STRIPE_SECRET_KEY=sk_test_placeholder
SENDGRID_API_KEY=SG.placeholder
JWT_SECRET=your_secret_key_minimum_32_characters_long
API_KEY=dev_api_key_for_testing
```

---

## Step 3: Frontend Setup

```bash
# Navigate to frontend (from project root)
cd ../frontend

# Install dependencies
npm install

# Create environment file
echo REACT_APP_API_URL=http://localhost:3000 > .env
echo REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder >> .env
echo REACT_APP_API_KEY=dev_api_key_for_testing >> .env
```

---

## Step 4: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

---

## Step 5: Access the Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## Quick Test

1. Open browser to http://localhost:3001
2. Click "Create Order"
3. Fill in the form
4. View the monitoring dashboard

---

## Docker Alternative (Recommended)

If you have Docker installed:

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
# Frontend: http://localhost
# Backend: http://localhost:3000
```

---

## For Full Production Setup

See detailed guides:
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)

---

## Getting Real API Keys

### AWS
1. Go to AWS Console
2. Create IAM user
3. Generate access keys
4. Create DynamoDB table
5. Create SNS topic

### Stripe
1. Sign up at https://stripe.com
2. Get test API keys from Dashboard → Developers → API keys

### SendGrid
1. Sign up at https://sendgrid.com
2. Create API key with Full Access

### Google Sheets
1. Go to Google Cloud Console
2. Enable Sheets API
3. Create service account
4. Download credentials JSON

---

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or change PORT in .env
```

**Dependencies not installing:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Can't connect to backend:**
- Check backend is running on port 3000
- Check CORS settings in .env
- Verify API_KEY matches in both .env files

---

## Next Steps

1. ✅ Read [PROJECT_REPORT.md](docs/PROJECT_REPORT.md)
2. ✅ Explore [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
3. ✅ Check [ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. ✅ Review code in `backend/src/` and `frontend/src/`
5. ✅ Test API endpoints with Postman/Thunder Client
6. ✅ Deploy to production following [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## Support

**GitHub Issues:** https://github.com/jeffmakuto/deep-learning/issues

**Documentation:** All docs in `/docs` folder

---

**Happy Coding! 🚀**
