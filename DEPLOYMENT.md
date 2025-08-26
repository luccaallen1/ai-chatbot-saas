# 🚀 AI Chatbot SaaS - Deployment Guide

## Railway Deployment (Recommended - Free Tier)

### Prerequisites
- GitHub account with repository: `luccaallen1/ai-chatbot-saas`
- Railway account (sign up at https://railway.app)

### Step 1: Deploy to Railway

1. **Login to Railway**
   - Go to https://railway.app
   - Click "Login with GitHub"
   - Authorize Railway

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `luccaallen1/ai-chatbot-saas`
   - Railway will auto-detect the Node.js app

3. **Add PostgreSQL Database**
   - In your Railway project dashboard
   - Click "New Service" → "Database" → "PostgreSQL"
   - Railway will create a free PostgreSQL instance

### Step 2: Configure Environment Variables

Go to your backend service → "Variables" tab and add:

```env
# Database (auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# OpenAI (REQUIRED for AI responses)
OPENAI_API_KEY=sk-your-openai-api-key-here

# App Configuration
NODE_ENV=production
PORT=${{PORT}}
CLIENT_URL=https://your-frontend-domain.com
WIDGET_CDN_URL=${{RAILWAY_STATIC_URL}}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# First deployment only (set to true for initial seed)
SEED_DATABASE=true
```

### Step 3: Deploy and Access

1. **Deployment**
   - Railway will automatically deploy when you push to GitHub
   - First deployment will run database migrations
   - Check logs in Railway dashboard

2. **Generate Domain**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - You'll get: `https://your-app-name.railway.app`

3. **Test Endpoints**
   ```bash
   # Health check
   curl https://your-app.railway.app/health
   
   # Widget CDN
   curl https://your-app.railway.app/widget.js
   ```

### Step 4: Test the API

1. **Register a new user**
   ```bash
   curl -X POST https://your-app.railway.app/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST https://your-app.railway.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Demo Account** (if SEED_DATABASE=true)
   - Email: `demo@example.com`
   - Password: `demo123456`

## Alternative Deployment Options

### Render.com (Free with limitations)
1. Connect GitHub repo
2. Add PostgreSQL database
3. Set environment variables
4. Deploy (note: free tier sleeps after 15 mins)

### Heroku (Paid)
1. Create new app
2. Add Heroku Postgres
3. Connect GitHub
4. Deploy

### DigitalOcean App Platform
1. Create new app
2. Connect GitHub
3. Add managed database
4. Configure environment
5. Deploy

## Production Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Add your OpenAI API key
- [ ] Configure `CLIENT_URL` for CORS
- [ ] Set up custom domain (optional)
- [ ] Configure email service (optional)
- [ ] Set up Stripe for payments (optional)
- [ ] Enable monitoring/logging
- [ ] Set `SEED_DATABASE=false` after first deploy

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is properly set
- Check PostgreSQL service is running in Railway

### Build Failures
- Check Node.js version (requires 18+)
- Verify all dependencies in package.json
- Check Railway build logs

### API Not Responding
- Verify `PORT` environment variable
- Check health endpoint: `/health`
- Review application logs in Railway

## Support

For issues or questions:
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/luccaallen1/ai-chatbot-saas/issues

## Next Steps

1. **Frontend Dashboard**: Build React app for widget management
2. **Custom Domain**: Add your domain in Railway settings
3. **Monitoring**: Set up error tracking (Sentry)
4. **Analytics**: Add PostHog or Mixpanel
5. **Payment Integration**: Configure Stripe