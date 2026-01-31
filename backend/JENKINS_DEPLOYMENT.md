# Jenkins Deployment Guide

This guide explains how to deploy both frontend and backend applications in Jenkins so they continue running after the job finishes.

## Solution 1: PM2 (Recommended)

PM2 is a production-grade process manager that keeps Node.js applications running in the background.

### Setup Steps:

1. **Install PM2 globally** (if not already installed):
   ```bash
   npm install -g pm2
   ```

2. **In your Jenkins job for Backend**, use these commands:
   ```bash
   cd backend
   npm install
   npm run build
   npm run start:pm2
   ```

3. **In your Jenkins job for Frontend**, use these commands:
   ```bash
   cd frontend
   npm install
   npm run build
   npm run start:pm2
   ```
   
   **Note:** Frontend requires building first (`npm run build`) to create the production static files before serving with PM2.

4. **PM2 will automatically:**
   - Keep the process running after Jenkins job finishes
   - Restart the application if it crashes
   - Save logs to `backend/logs/pm2-*.log` (backend) or `frontend/logs/pm2-*.log` (frontend)
   - Run in the background detached from the Jenkins job

### PM2 Management Commands:

**Backend:**
- **Start**: `cd backend && npm run start:pm2` or `pm2 start backend/ecosystem.config.js`
- **Stop**: `pm2 stop feedback-app-backend`
- **Restart**: `pm2 restart feedback-app-backend`
- **View logs**: `pm2 logs feedback-app-backend`
- **Delete**: `pm2 delete feedback-app-backend`

**Frontend:**
- **Start**: `cd frontend && npm run start:pm2` or `pm2 start frontend/ecosystem.config.js`
- **Stop**: `pm2 stop feedback-app-frontend`
- **Restart**: `pm2 restart feedback-app-frontend`
- **View logs**: `pm2 logs feedback-app-frontend`
- **Delete**: `pm2 delete feedback-app-frontend`

**Both:**
- **View status**: `pm2 status` (shows all PM2 processes)
- **View all logs**: `pm2 logs` (shows logs from all processes)

### PM2 Startup Script (Optional - for server reboots):

To make PM2 start automatically on server reboot:
```bash
pm2 startup
pm2 save
```

---

## Solution 2: nohup (Simple Alternative)

If you prefer not to use PM2, you can use `nohup`:

### Jenkins Job Commands:

**Backend:**
```bash
cd backend
npm install
npm run build
nohup npm start > logs/nohup.out 2>&1 &
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
nohup npm run serve > logs/nohup.out 2>&1 &
```

The `&` at the end runs it in the background, and `nohup` prevents it from being killed when Jenkins job finishes.

### To stop the process:
```bash
# Find the process
ps aux | grep "node dist/index.js"  # Backend
ps aux | grep "serve"                # Frontend
# Kill it
kill <PID>
```

---

## Solution 3: screen/tmux (Terminal Multiplexer)

If `screen` or `tmux` is available on your Jenkins server:

### Using screen:
```bash
# Backend
cd backend
npm install
npm run build
screen -dmS feedback-backend npm start

# Frontend
cd frontend
npm install
npm run build
screen -dmS feedback-frontend npm run serve
```

### Using tmux:
```bash
# Backend
cd backend
npm install
npm run build
tmux new-session -d -s feedback-backend 'npm start'

# Frontend
cd frontend
npm install
npm run build
tmux new-session -d -s feedback-frontend 'npm run serve'
```

### To reconnect to the session:
- screen: `screen -r feedback-backend` or `screen -r feedback-frontend`
- tmux: `tmux attach -t feedback-backend` or `tmux attach -t feedback-frontend`

---

## Solution 4: systemd Service (Linux Only)

For a more permanent solution on Linux servers, create a systemd service:

### Create service files:

**Backend:** `/etc/systemd/system/feedback-backend.service`
```ini
[Unit]
Description=Feedback App Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/employee-feedback-app/backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

**Frontend:** `/etc/systemd/system/feedback-frontend.service`
```ini
[Unit]
Description=Feedback App Frontend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/employee-feedback-app/frontend
ExecStart=/usr/bin/npm run serve
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable feedback-backend feedback-frontend
sudo systemctl start feedback-backend feedback-frontend
```

---

## Recommended Approach

**For Jenkins deployments, we recommend PM2 (Solution 1)** because:
- ✅ Keeps process running after Jenkins job finishes
- ✅ Automatic restarts on crashes
- ✅ Built-in logging
- ✅ Easy management commands
- ✅ Production-ready
- ✅ Works on Windows and Linux

---

## Troubleshooting

### Check if the process is running:
```bash
# For PM2
pm2 status

# For nohup/screen/tmux
ps aux | grep node
```

### View logs:
```bash
# PM2 logs
pm2 logs feedback-app-backend   # Backend
pm2 logs feedback-app-frontend  # Frontend
pm2 logs                        # All processes

# Application logs
tail -f backend/logs/*.log
tail -f frontend/logs/*.log

# nohup logs
tail -f backend/logs/nohup.out
tail -f frontend/logs/nohup.out
```

### If port is already in use:
```bash
# Find process using port 3001 (backend) or 3000 (frontend)
lsof -i :3001  # Linux/Mac - Backend
lsof -i :3000  # Linux/Mac - Frontend
netstat -ano | findstr :3001  # Windows - Backend
netstat -ano | findstr :3000  # Windows - Frontend

# Kill the process
kill <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

---

## Complete Deployment Example

### Deploying Both Frontend and Backend in Jenkins:

```bash
# Backend deployment
cd backend
npm install
npm run build
npm run start:pm2

# Frontend deployment
cd ../frontend
npm install
npm run build
npm run start:pm2

# Verify both are running
pm2 status
```

