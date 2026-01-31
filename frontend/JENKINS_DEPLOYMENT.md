# Frontend Jenkins Deployment Guide

This is a quick reference for frontend deployment. For complete details, see `../backend/JENKINS_DEPLOYMENT.md`.

## Quick Start with PM2

1. **Install PM2 globally** (if not already installed):
   ```bash
   npm install -g pm2
   ```

2. **In your Jenkins job**, use these commands:
   ```bash
   cd frontend
   npm install
   npm run build
   npm run start:pm2
   ```

   **Important:** Frontend must be built (`npm run build`) before starting with PM2, as PM2 serves the static build files.

## PM2 Management Commands

- **Start**: `npm run start:pm2` or `pm2 start ecosystem.config.js`
- **Stop**: `npm run stop:pm2` or `pm2 stop feedback-app-frontend`
- **Restart**: `npm run restart:pm2` or `pm2 restart feedback-app-frontend`
- **View logs**: `npm run logs:pm2` or `pm2 logs feedback-app-frontend`
- **View status**: `pm2 status`
- **Delete**: `npm run delete:pm2` or `pm2 delete feedback-app-frontend`

## What PM2 Does

- ✅ Keeps process running after Jenkins job finishes
- ✅ Automatically restarts if the application crashes
- ✅ Saves logs to `frontend/logs/pm2-*.log`
- ✅ Runs in the background detached from Jenkins job
- ✅ Serves the built React app on port 3000

## Troubleshooting

### Check if running:
```bash
pm2 status
```

### View logs:
```bash
pm2 logs feedback-app-frontend
tail -f frontend/logs/pm2-*.log
```

### If port 3000 is in use:
```bash
# Find process
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Kill process
kill <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### Rebuild and restart:
```bash
cd frontend
npm run build
pm2 restart feedback-app-frontend
```

