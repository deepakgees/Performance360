# Railway Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Create Account (2 minutes)

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Click **"Login with GitHub"**
4. Authorize Railway
5. ✅ Account created!

### Step 2: Set Cost Limit (1 minute)

1. Click your profile → **"Team Settings"**
2. Go to **"Usage"** → **"Usage Limits"**
3. Set **Hard Limit**: `15` ($15/month)
4. Enable alerts at 75% and 90%
5. ✅ Cost protection enabled!

### Step 3: Deploy Database (1 minute)

1. Click **"New Project"**
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Wait for database to provision
4. Click database → **"Variables"** tab
5. Copy `DATABASE_URL`
6. ✅ Database ready!

### Step 4: Deploy Backend (1 minute)

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Railway detects it - click the service
4. Set **Root Directory**: `backend`
5. Go to **"Variables"** tab, add:
   ```
   DATABASE_URL = <paste from step 3>
   NODE_ENV = production
   PORT = 3001
   ```
6. Wait for deployment (2-3 minutes)
7. Copy the service URL (e.g., `https://xxx.railway.app`)
8. ✅ Backend deployed!

### Step 5: Deploy Frontend (1 minute)

1. Click **"+ New"** → **"GitHub Repo"** (same repo)
2. Set **Root Directory**: `frontend`
3. Go to **"Variables"** tab, add:
   ```
   REACT_APP_API_URL = https://xxx.railway.app/api
   ```
   (Replace `xxx` with your backend URL from step 4)
4. Wait for deployment (2-3 minutes)
5. Copy the frontend URL
6. Go back to backend → **"Variables"**
7. Add: `FRONTEND_URL = <your-frontend-url>`
8. ✅ Frontend deployed!

### Step 6: Run Migrations (1 minute)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   ```

2. Run migrations:
   ```bash
   railway run npx prisma generate
   railway run npx prisma migrate deploy
   ```

3. ✅ Database ready!

### Step 7: Test (30 seconds)

1. Open your frontend URL in browser
2. Test the application
3. ✅ Everything works!

---

## 📋 Environment Variables Checklist

### Backend:
- [ ] `DATABASE_URL` (from PostgreSQL service)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `FRONTEND_URL` (your frontend URL)

### Frontend:
- [ ] `REACT_APP_API_URL` (your backend URL + `/api`)

---

## 💰 Cost Breakdown

- **Database**: ~$6/month (if running 24/7)
- **Backend**: ~$12/month (if running 24/7)
- **Frontend**: ~$6/month (if running 24/7)
- **Total (24/7)**: ~$24/month
- **With $15 limit**: Never pay more than $15!

**Actual cost**: Usually $8-12/month depending on usage

---

## 🔄 Auto-Deploy Setup

Both services should auto-deploy by default. To verify:

1. Go to service → **"Settings"**
2. Under **"Source"**, ensure **"Auto Deploy"** is enabled
3. Select branch: `main` or `master`
4. ✅ Every Git push will auto-deploy!

---

## 🛠️ Troubleshooting

**Build fails?**
- Check logs in Railway dashboard
- Verify `package.json` scripts are correct

**Can't connect to database?**
- Verify `DATABASE_URL` is correct
- Run migrations: `railway run npx prisma migrate deploy`

**Frontend can't reach backend?**
- Check `REACT_APP_API_URL` is correct
- Verify `FRONTEND_URL` in backend matches frontend URL

**Services stopped?**
- Check if cost limit was reached
- Increase limit or wait for next billing cycle

---

## 📚 Need More Help?

- Full guide: See `RAILWAY_SETUP_GUIDE.md`
- Railway docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

---

**You're all set! 🎉**
