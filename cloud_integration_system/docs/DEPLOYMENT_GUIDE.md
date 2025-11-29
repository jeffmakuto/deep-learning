# Deployment Guide

## Cloud-Based Integration System - Deployment Documentation

This guide provides step-by-step instructions for deploying the Cloud Integration System to various environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [AWS Infrastructure Setup](#aws-infrastructure-setup)
4. [Third-Party Service Configuration](#third-party-service-configuration)
5. [Docker Deployment](#docker-deployment)
6. [Production Deployment](#production-deployment)
7. [Monitoring Setup](#monitoring-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- [ ] AWS Account (with admin access)
- [ ] Stripe Account (test mode for development)
- [ ] SendGrid Account
- [ ] Google Cloud Console Account

### Required Software

- Node.js v16 or higher
- npm v8 or higher
- Docker and Docker Compose
- AWS CLI v2
- Git

### Installation

**Node.js**
```bash
# Windows (using Chocolatey)
choco install nodejs

# Or download from nodejs.org
```

**AWS CLI**
```bash
# Windows
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version
```

**Docker Desktop**
```bash
# Download from docker.com
# Install Docker Desktop for Windows
```

---

## Local Development Setup

### 1. Clone Repository

```bash
cd c:\Users\jeff\Projects\deep-learning
cd cloud_integration_system
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
notepad .env
```

**.env Configuration**
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# AWS (use localstack for local development or real AWS credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DYNAMODB_TABLE=orders-table-dev
AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:order-notifications

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=dev@yourdomain.com
SENDGRID_FROM_NAME=Dev E-Commerce

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS=./config/google-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# Security
JWT_SECRET=your_dev_jwt_secret_at_least_32_chars
API_KEY=dev_api_key_change_in_production
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
echo REACT_APP_API_URL=http://localhost:3000 > .env
echo REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_... >> .env
echo REACT_APP_API_KEY=dev_api_key_change_in_production >> .env
```

### 4. Start Development Servers

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm start
```

Access the application:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

---

## AWS Infrastructure Setup

### 1. Configure AWS CLI

```bash
aws configure

# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### 2. Create DynamoDB Table

```bash
aws dynamodb create-table `
  --table-name orders-table `
  --attribute-definitions AttributeName=id,AttributeType=S `
  --key-schema AttributeName=id,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region us-east-1
```

**Verify table creation:**
```bash
aws dynamodb describe-table --table-name orders-table
```

### 3. Create SNS Topic

```bash
# Create topic
aws sns create-topic --name order-notifications

# Note the TopicArn returned
# Example: arn:aws:sns:us-east-1:123456789012:order-notifications

# Subscribe email for notifications
aws sns subscribe `
  --topic-arn arn:aws:sns:us-east-1:123456789012:order-notifications `
  --protocol email `
  --notification-endpoint your-email@example.com

# Confirm subscription via email
```

### 4. Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /aws/integration-system

# Create log stream
aws logs create-log-stream `
  --log-group-name /aws/integration-system `
  --log-stream-name production
```

### 5. Create IAM User for Application

```bash
# Create user
aws iam create-user --user-name integration-system-app

# Attach policies
aws iam attach-user-policy `
  --user-name integration-system-app `
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-user-policy `
  --user-name integration-system-app `
  --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess

aws iam attach-user-policy `
  --user-name integration-system-app `
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# Create access key
aws iam create-access-key --user-name integration-system-app

# Save the AccessKeyId and SecretAccessKey
```

---

## Third-Party Service Configuration

### 1. Stripe Setup

**Create Account**
1. Go to https://stripe.com
2. Sign up for account
3. Go to Developers → API keys
4. Copy **Publishable key** and **Secret key**

**Setup Webhook**
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy **Webhook signing secret**

**Test Mode**
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### 2. SendGrid Setup

**Create Account**
1. Go to https://sendgrid.com
2. Sign up for free account (100 emails/day)
3. Go to Settings → API Keys
4. Create API key with "Full Access"
5. Copy the API key (shown once)

**Verify Sender**
1. Go to Settings → Sender Authentication
2. Verify single sender email
3. Check email and click verification link

### 3. Google Sheets Setup

**Enable API**
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google Sheets API
4. Go to Credentials → Create Credentials → Service Account
5. Download JSON key file
6. Rename to `google-credentials.json`
7. Place in `backend/config/`

**Create Spreadsheet**
1. Create new Google Sheet
2. Share with service account email (from JSON file)
3. Copy spreadsheet ID from URL
4. Update `.env` file

**Initialize Sheet**
```bash
# Run once to create headers
cd backend
node -e "require('./src/services/sheetsService').setupSheet()"
```

---

## Docker Deployment

### 1. Create Docker Files

**backend/Dockerfile**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**frontend/Dockerfile**
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml** (in root)
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 2. Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Production Deployment

### Option 1: AWS EC2

**1. Launch EC2 Instance**
```bash
# Create security group
aws ec2 create-security-group `
  --group-name integration-system `
  --description "Cloud Integration System"

# Add rules
aws ec2 authorize-security-group-ingress `
  --group-name integration-system `
  --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress `
  --group-name integration-system `
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress `
  --group-name integration-system `
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Launch instance (use appropriate AMI ID)
aws ec2 run-instances `
  --image-id ami-0c55b159cbfafe1f0 `
  --instance-type t2.medium `
  --key-name your-key-pair `
  --security-groups integration-system
```

**2. Connect and Setup**
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/jeffmakuto/deep-learning.git
cd deep-learning/cloud_integration_system

# Configure environment
nano backend/.env

# Start application
docker-compose up -d
```

### Option 2: AWS ECS (Elastic Container Service)

**1. Create ECR Repositories**
```bash
aws ecr create-repository --repository-name integration-system-backend
aws ecr create-repository --repository-name integration-system-frontend
```

**2. Build and Push Images**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t integration-system-backend ./backend
docker tag integration-system-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/integration-system-backend:latest

# Push
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/integration-system-backend:latest
```

**3. Create ECS Cluster and Service**
```bash
# Create cluster
aws ecs create-cluster --cluster-name integration-system

# Register task definition (see task-definition.json)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service `
  --cluster integration-system `
  --service-name integration-api `
  --task-definition integration-system:1 `
  --desired-count 2 `
  --launch-type FARGATE
```

### Option 3: AWS Lambda + API Gateway

**1. Install Serverless Framework**
```bash
npm install -g serverless
```

**2. Create serverless.yml**
```yaml
service: integration-system

provider:
  name: aws
  runtime: nodejs16.x
  region: us-east-1
  environment:
    AWS_DYNAMODB_TABLE: ${env:AWS_DYNAMODB_TABLE}
    STRIPE_SECRET_KEY: ${env:STRIPE_SECRET_KEY}

functions:
  createOrder:
    handler: src/lambda/orders.create
    events:
      - http:
          path: orders
          method: post
          cors: true
```

**3. Deploy**
```bash
cd backend
serverless deploy
```

---

## Monitoring Setup

### 1. CloudWatch Dashboard

```bash
# Create dashboard
aws cloudwatch put-dashboard --dashboard-name IntegrationSystem --dashboard-body file://dashboard.json
```

**dashboard.json**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["CloudIntegrationSystem", "OrdersCreated"],
          [".", "PaymentSuccess"],
          [".", "EmailSent"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "System Metrics"
      }
    }
  ]
}
```

### 2. CloudWatch Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm `
  --alarm-name high-error-rate `
  --alarm-description "Alert when error rate exceeds 5%" `
  --metric-name Errors `
  --namespace CloudIntegrationSystem `
  --statistic Average `
  --period 300 `
  --evaluation-periods 2 `
  --threshold 5.0 `
  --comparison-operator GreaterThanThreshold
```

---

## Troubleshooting

### Common Issues

**1. DynamoDB Connection Failed**
```bash
# Verify table exists
aws dynamodb describe-table --table-name orders-table

# Check IAM permissions
aws iam get-user-policy --user-name integration-system-app --policy-name DynamoDBAccess
```

**2. Stripe Webhook Not Working**
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger payment_intent.succeeded
```

**3. SendGrid Email Not Sending**
```bash
# Verify API key
curl -X POST https://api.sendgrid.com/v3/mail/send `
  -H "Authorization: Bearer $SENDGRID_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{...}'
```

**4. Google Sheets Permission Denied**
```bash
# Verify service account has access
# Share spreadsheet with service account email
```

### Logs and Debugging

**View CloudWatch Logs**
```bash
aws logs tail /aws/integration-system --follow
```

**Docker Logs**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Application Logs**
```bash
# Backend logs
cd backend
tail -f logs/combined.log
```

---

## Security Checklist

- [ ] Environment variables not committed to Git
- [ ] HTTPS enabled in production
- [ ] API keys rotated regularly
- [ ] IAM permissions follow least privilege
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (N/A - using NoSQL)
- [ ] XSS protection enabled
- [ ] Security headers configured (Helmet.js)

---

## Performance Optimization

1. **Enable Caching**
   - CloudFront for static assets
   - Redis for API responses

2. **Database Optimization**
   - DynamoDB GSI for common queries
   - Batch operations where possible

3. **API Optimization**
   - Connection pooling
   - Async operations
   - Compression enabled

---

## Backup and Recovery

**DynamoDB Backups**
```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups `
  --table-name orders-table `
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Create on-demand backup
aws dynamodb create-backup `
  --table-name orders-table `
  --backup-name orders-table-backup-$(date +%Y%m%d)
```

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] AWS resources created
- [ ] Third-party services configured
- [ ] SSL certificate installed
- [ ] Domain name configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

---

**Document Version**: 1.0  
**Last Updated**: November 29, 2025
