/**
 * PM2 Ecosystem Configuration for Frontend
 * 
 * This file configures PM2 to manage the frontend application.
 * PM2 will keep the process running even after Jenkins job finishes.
 * 
 * Note: Make sure to run 'npm run build' before starting with PM2
 * 
 * Usage:
 *   npm run build        - Build the React app first
 *   npm run start:pm2    - Start the application with PM2
 *   npm run stop:pm2     - Stop the application
 *   npm run restart:pm2  - Restart the application
 *   npm run logs:pm2     - View application logs
 */

module.exports = {
  apps: [
    {
      name: 'feedback-app-frontend',
      script: './start-serve.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
    },
  ],
};

