# Complete Railway Deployment Setup Guide

## Step-by-Step Setup Instructions

### Part 1: Create Railway Account

1. **Go to Railway Website**
   - Visit: https://railway.app
   - Click **"Start a New Project"** or **"Login"**

2. **Sign Up with GitHub**
   - Click **"Login with GitHub"**
   - Authorize Railway to access your GitHub account
   - Railway will create your account automatically

3. **Verify Your Email** (if prompted)
   - Check your email for verification link
   - Click the link to verify your account

4. **Complete Onboarding**
   - Railway may show a tutorial - you can skip it
   - You'll land on the Railway dashboard

---

### Part 2: Set Up Cost Limit (IMPORTANT!)

1. **Navigate to Settings**
   - Click your profile icon (top right)
   - Select **"Team Settings"** or **"Account Settings"**

2. **Go to Usage Limits**
   - Click **"Usage"** or **"Billing"** in the left sidebar
   - Find **"Usage Limits"** section

3. **Set Hard Limit**
   - Click **"Set Limit"** or **"Edit Limit"**
   - Enter your maximum monthly budget (e.g., `15` for $15/month)
   - **Minimum**: $10
   - **Recommended**: $15-20 for your app

4. **Set Soft Limit Alerts**
   - Enable email alerts at **75%** of your limit
   - Enable email alerts at **90%** of your limit
   - This gives you warning before hitting the hard limit

5. **Save Settings**
   - Click **"Save"** or **"Update Limit"**
   - ✅ Your cost is now capped - you'll never pay more than this amount!

---

### Part 3: Prepare Your Repository

1. **Push Code to GitHub** (if not already done)
   ```bash
   # Make sure all changes are committed
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Verify Files Are Ready**
   - ✅ `backend/package.json` exists
   - ✅ `frontend/package.json` exists
   - ✅ `backend/railway.json` exists (we just created it)
   - ✅ `frontend/railway.json` exists (we just created it)
   - ✅ `.railwayignore` exists (we just created it)

---

### Part 4: Deploy PostgreSQL Database

1. **Create New Project**
   - In Railway dashboard, click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository (or skip for now)

2. **Provision PostgreSQL**
   - In your project, click **"+ New"**
   - Select **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically create a PostgreSQL database

3. **Get Database URL**
   - Click on the PostgreSQL service
   - Go to **"Variables"** tab
   - Copy the `DATABASE_URL` value
   - **Save this** - you'll need it for the backend!

4. **Note the Database Details**
   - Database name, user, and host are in the connection string
   - Railway manages this automatically

---

### Part 5: Deploy Backend Service

1. **Add Backend Service**
   - In your Railway project, click **"+ New"**
   - Select **"GitHub Repo"**
   - Choose your repository
   - Railway will detect it's a monorepo

2. **Configure Backend Service**
   - Railway will show a service
   - Click on it to configure
   - Set the following:

   **Service Settings:**
   - **Name**: `backend` (or leave default)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build` (auto-detected)
   - **Start Command**: `npm start` (auto-detected)

3. **Set Environment Variables**
   - Click on the backend service
   - Go to **"Variables"** tab
   - Click **"+ New Variable"**
   - Add these variables:

   ```
   DATABASE_URL = <paste from PostgreSQL service>
   NODE_ENV = production
   PORT = 3001
   FRONTEND_URL = https://your-frontend.railway.app
   ```

   **Note**: Replace `your-frontend.railway.app` with your actual frontend URL (you'll get this after deploying frontend)

4. **Enable Auto-Deploy**
   - Go to **"Settings"** tab
   - Under **"Source"**, ensure **"Auto Deploy"** is enabled
   - Select branch: `main` (or `master`)
   - ✅ Every push to this branch will auto-deploy!

5. **Deploy**
   - Railway will automatically start deploying
   - Watch the build logs
   - Wait for deployment to complete (usually 2-5 minutes)

6. **Get Backend URL**
   - Once deployed, Railway will show a URL like: `https://your-backend.railway.app`
   - Click **"Generate Domain"** if needed
   - **Copy this URL** - you'll need it for the frontend!

---

### Part 6: Run Database Migrations

**Method 1: Using Railway CLI (RECOMMENDED - Easiest)**

1. **Install Railway CLI** (if not already installed)
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```
   - This will open a browser for authentication
   - Authorize Railway CLI

3. **Link to Your Project**
   ```bash
   railway link
   ```
   - Select your project from the list
   - Select your backend service

4. **Run Prisma Commands**
   ```bash
   # Generate Prisma client
   railway run npx prisma generate
   
   # Deploy migrations
   railway run npx prisma migrate deploy
   ```

5. **Verify Migration**
   ```bash
   railway run npx prisma migrate status
   ```
   - Should show: "Database schema is up to date!"

---

**Method 2: Using Railway Web Terminal**

1. **Access Terminal in Railway Dashboard**
   - Go to your Railway project dashboard
   - Click on your **backend service** (not the deployment)
   - Look for one of these options:
     - **"Terminal"** tab (at the top)
     - **"Connect"** button (top right)
     - **"Shell"** option in the service menu
     - **"Open Terminal"** button

2. **If Terminal Tab is Not Visible:**
   - Railway's UI may vary
   - Try clicking on the service name itself
   - Look for a terminal icon or ">" symbol
   - Check the right sidebar for terminal options

3. **Run Prisma Commands**
   - Once terminal opens, run:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Verify Migration**
   - Check for success messages
   - Database tables should now be created

---

**Method 3: Add to Build Script (Automatic)**

You can also add Prisma commands to your build process so they run automatically:

1. **Update `backend/package.json`**:
   ```json
   {
     "scripts": {
       "build": "npm run db:generate && tsc",
       "postbuild": "npx prisma migrate deploy",
       "db:generate": "prisma generate"
     }
   }
   ```

2. **This will run automatically on each deployment**

---

**Which Method to Use?**

- **Method 1 (CLI)**: Best for one-time setup and manual migrations
- **Method 2 (Web Terminal)**: Good if you prefer web interface
- **Method 3 (Build Script)**: Best for automatic migrations on every deploy

---

### Part 7: Deploy Frontend Service

1. **Add Frontend Service**
   - In your Railway project, click **"+ New"**
   - Select **"GitHub Repo"** (same repo)
   - Or click **"+ New"** → **"Static Site"**

2. **Configure Frontend Service**
   - If using GitHub repo:
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Output Directory**: `build`
   - If using Static Site:
     - Connect to your GitHub repo
     - Set root directory to `frontend`

3. **Set Environment Variables**
   - Click on the frontend service
   - Go to **"Variables"** tab
   - Add:

   ```
   REACT_APP_API_URL = https://your-backend.railway.app/api
   ```

   **Important**: Replace `your-backend.railway.app` with your actual backend URL from Part 5!

4. **Enable Auto-Deploy**
   - Go to **"Settings"** tab
   - Enable **"Auto Deploy"**
   - Select branch: `main` (or `master`)

5. **Deploy**
   - Railway will automatically build and deploy
   - Wait for completion (usually 2-5 minutes)

6. **Get Frontend URL**
   - Railway will show a URL like: `https://your-frontend.railway.app`
   - **Copy this URL**

7. **Update Backend CORS**
   - Go back to backend service
   - Update `FRONTEND_URL` variable with your frontend URL
   - This allows frontend to communicate with backend

---

### Part 8: Verify Deployment

1. **Test Frontend**
   - Open your frontend URL in a browser
   - The app should load

2. **Test Backend API**
   - Visit: `https://your-backend.railway.app/api/health`
   - Should return: `{"status":"OK",...}`

3. **Test Full Flow**
   - Try logging in or accessing features
   - Check browser console for errors
   - Check Railway logs if issues occur

---

### Part 9: Install Railway CLI (Optional but Recommended)

1. **Install CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```
   - This will open a browser for authentication

3. **Link to Project**
   ```bash
   railway link
   ```
   - Select your project from the list

4. **Useful CLI Commands**
   ```bash
   # View usage
   railway usage

   # View logs
   railway logs

   # Run commands in service
   railway run npx prisma migrate deploy

   # Deploy manually
   railway up

   # View service status
   railway status
   ```

---

### Part 10: Configure Auto-Restart (Optional)

1. **Set Restart Policy**
   - Go to backend service → **"Settings"**
   - Find **"Restart Policy"**
   - Options:
     - **Always**: Restart on any stop (uses more resources)
     - **On Failure**: Restart only on errors (default, recommended)
     - **Never**: No auto-restart

2. **Recommended**: Keep **"On Failure"** to save costs

---

## Environment Variables Reference

### Backend Variables:
```env
DATABASE_URL=postgresql://postgres:password@host:5432/railway
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend.railway.app
```

### Frontend Variables:
```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

---

## Cost Monitoring

1. **View Usage**
   - Go to Railway dashboard
   - Click **"Usage"** in sidebar
   - See real-time spending

2. **Set Up Alerts**
   - Already configured in Part 2
   - You'll get emails at 75% and 90% of limit

3. **What Happens at Limit**
   - All services automatically stop
   - No charges above your limit
   - Services remain stopped until you:
     - Increase the limit, OR
     - Wait for next billing cycle

---

## Troubleshooting

### Build Fails
- Check build logs in Railway
- Verify `package.json` has correct scripts
- Ensure all dependencies are listed

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check if migrations ran successfully
- Ensure database service is running

### Frontend Can't Connect to Backend
- Verify `REACT_APP_API_URL` is correct
- Check `FRONTEND_URL` in backend matches frontend URL
- Check CORS settings in backend code

### Services Won't Start
- Check logs for errors
- Verify environment variables are set
- Ensure cost limit hasn't been reached

### Auto-Deploy Not Working
- Verify GitHub integration is connected
- Check branch name matches (main vs master)
- Ensure files are committed and pushed

---

## Next Steps After Deployment

1. **Set Up Custom Domain** (Optional)
   - Go to service → **"Settings"** → **"Domains"**
   - Add your custom domain
   - Railway will provide DNS instructions

2. **Enable HTTPS** (Automatic)
   - Railway provides SSL certificates automatically
   - No additional configuration needed

3. **Set Up Monitoring** (Optional)
   - Consider adding error tracking (Sentry)
   - Monitor Railway logs regularly

4. **Database Backups**
   - Railway includes automatic backups
   - Check backup settings in PostgreSQL service

---

## Quick Reference Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# View usage
railway usage

# View logs
railway logs

# Run migrations
railway run npx prisma migrate deploy

# Deploy manually
railway up
```

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

## Checklist

- [ ] Created Railway account
- [ ] Set hard cost limit ($15/month)
- [ ] Set up soft limit alerts (75%, 90%)
- [ ] Pushed code to GitHub
- [ ] Deployed PostgreSQL database
- [ ] Copied DATABASE_URL
- [ ] Deployed backend service
- [ ] Set backend environment variables
- [ ] Enabled auto-deploy for backend
- [ ] Got backend URL
- [ ] Ran database migrations
- [ ] Deployed frontend service
- [ ] Set frontend environment variables
- [ ] Enabled auto-deploy for frontend
- [ ] Got frontend URL
- [ ] Updated backend FRONTEND_URL
- [ ] Tested application
- [ ] Verified cost monitoring

---

**Congratulations! Your app is now deployed on Railway! 🎉**
