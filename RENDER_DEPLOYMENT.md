# 🚀 AI Chatbot SaaS - Render Deployment Guide

## Deploy to Render (100% Free)

Render provides a completely free tier for both your API and PostgreSQL database!

### Prerequisites
- GitHub account with repository: `luccaallen1/ai-chatbot-saas`
- Render account (sign up at https://render.com)

---

## Step 1: Create Render Account

1. **Go to Render**: https://render.com
2. **Sign up with GitHub** (easiest option)
3. **Connect your GitHub** account

---

## Step 2: Deploy PostgreSQL Database

1. **Create Database**
   - Click "New +" → "PostgreSQL"
   - **Name**: `ai-chatbot-saas-db`
   - **Database**: `ai_chatbot_saas`
   - **User**: `chatbot_user`
   - **Region**: Choose closest to you
   - **Plan**: **Free** (0 GB storage)

2. **Get Database URL**
   - After creation, go to your database dashboard
   - Copy the **Internal Database URL**
   - Format: `postgresql://username:password@hostname:port/database`

---

## Step 3: Deploy Backend API

1. **Create Web Service**
   - Click "New +" → "Web Service"
   - **Connect GitHub** → Select `luccaallen1/ai-chatbot-saas`
   - **Name**: `ai-chatbot-saas-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Plan**: **Free**

2. **Configure Build & Start**
   - **Build Command**: `npm install && npm run build && chmod +x scripts/render-build.sh && ./scripts/render-build.sh`
   - **Start Command**: `npm start`

3. **Environment Variables**
   Click "Environment" and add these variables:

   ```env
   # Database (paste your database URL from Step 2)
   DATABASE_URL=postgresql://chatbot_user:password@hostname:port/ai_chatbot_saas

   # JWT (REQUIRED - generate a random secret)
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   JWT_EXPIRES_IN=7d

   # OpenAI (REQUIRED for AI responses)
   OPENAI_API_KEY=sk-your-openai-api-key-here

   # App Configuration
   NODE_ENV=production
   PORT=10000
   CLIENT_URL=https://your-frontend-domain.com
   WIDGET_CDN_URL=https://your-render-app.onrender.com

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # First deployment only
   SEED_DATABASE=true
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - First deploy takes 5-10 minutes

---

## Step 4: Access Your API

Once deployed, you'll get:
- **API URL**: `https://your-app-name.onrender.com`
- **Health Check**: `https://your-app-name.onrender.com/health`
- **Widget CDN**: `https://your-app-name.onrender.com/widget.js`

### Test Your API

```bash
# Test health endpoint
curl https://your-app-name.onrender.com/health

# Test widget CDN
curl https://your-app-name.onrender.com/widget.js

# Test registration
curl -X POST https://your-app-name.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "password123",
    "name": "Test User"
  }'
```

---

## Demo Account (Available after first deploy)

If `SEED_DATABASE=true`, you'll have:
- **Email**: `demo@example.com`
- **Password**: `demo123456`
- **Sample Widget**: Pre-configured customer support bot

---

## Important Notes

### ⚠️ Free Tier Limitations
- **Database**: 1 GB storage, connection limit
- **Web Service**: Goes to sleep after 15 minutes of inactivity
- **First request** after sleep takes 30+ seconds to wake up

### 🔄 Preventing Sleep
- Use a monitoring service like UptimeRobot
- Ping your health endpoint every 10 minutes
- Or upgrade to Render's paid plan ($7/month)

### 🔧 Environment Variables
- Set `WIDGET_CDN_URL` to your actual Render URL
- Change `JWT_SECRET` to a secure random string
- Add your OpenAI API key for AI responses
- Set `SEED_DATABASE=false` after first successful deploy

---

## Troubleshooting

### Build Failures
- Check build logs in Render dashboard
- Ensure Node.js version compatibility
- Verify all dependencies in package.json

### Database Connection Issues
- Verify `DATABASE_URL` format
- Ensure PostgreSQL service is running
- Check database connection limits

### App Not Responding
- App may be sleeping (free tier limitation)
- Check logs for error messages
- Verify environment variables are set

---

## Next Steps After Deployment

1. **Update WIDGET_CDN_URL** with your actual Render URL
2. **Test all endpoints** with demo account
3. **Set up monitoring** (UptimeRobot) to prevent sleeping
4. **Create frontend dashboard** for widget management
5. **Add custom domain** (paid plan required)

---

## Render vs Railway Comparison

| Feature | Render Free | Railway Free |
|---------|-------------|--------------|
| Cost | 100% Free | $5/month credit |
| Database | PostgreSQL included | PostgreSQL included |
| App Sleep | ⚠️ Yes (15 min) | ✅ No |
| Build Minutes | 500/month | Unlimited |
| Bandwidth | 100GB/month | 100GB/month |
| Custom Domains | ❌ Paid only | ✅ Free |

**Render is perfect for:** Development, testing, demos
**Railway is better for:** Production apps that need 24/7 uptime

---

## Deploy Now! 🚀

👉 **Start here**: https://render.com
1. Sign up with GitHub
2. Create PostgreSQL database
3. Deploy web service from `luccaallen1/ai-chatbot-saas`
4. Configure environment variables
5. Your AI Chatbot SaaS will be live!

Total time: ~15 minutes