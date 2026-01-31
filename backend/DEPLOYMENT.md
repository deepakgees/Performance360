# Deployment Guide

This guide covers various deployment options for the Performance360 Backend, from local development to production environments.

## 🏠 Local Development

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Git

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd performance360/backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your local database settings

# Set up database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

The server will be available at `http://localhost:5000`

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### Docker Compose

Create a `docker-compose.yml` file for local development with database:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '5000:5000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/feedback_app
      - JWT_SECRET=your-super-secret-jwt-key-here
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=feedback_app
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Docker Commands

```bash
# Build and run with Docker Compose
docker-compose up -d

# Build image manually
docker build -t feedback-app-backend .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  feedback-app-backend

# Run with environment file
docker run -p 5000:5000 --env-file .env feedback-app-backend
```

## ☁️ Cloud Deployment

### Heroku

1. **Install Heroku CLI**

   ```bash
   # macOS
   brew install heroku/brew/heroku

   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku app**

   ```bash
   heroku create your-feedback-app
   ```

3. **Add PostgreSQL addon**

   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Set environment variables**

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-super-secret-jwt-key-here
   heroku config:set FRONTEND_URL=https://your-frontend-app.herokuapp.com
   ```

5. **Deploy**

   ```bash
   git push heroku main
   ```

6. **Run database migrations**
   ```bash
   heroku run npm run db:migrate
   ```

### Railway

1. **Connect your GitHub repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub account
   - Select your repository

2. **Configure environment variables**

   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=https://your-frontend-url.com
   ```

3. **Add PostgreSQL service**
   - Add PostgreSQL service from Railway dashboard
   - Railway will automatically set `DATABASE_URL`

4. **Deploy**
   - Railway will automatically deploy on every push to main branch

### DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Select the backend directory

2. **Configure Environment**

   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=https://your-frontend-url.com
   ```

3. **Add Database**
   - Add PostgreSQL database service
   - Link it to your app

4. **Deploy**
   - DigitalOcean will automatically deploy your app

### AWS (EC2 + RDS)

1. **Launch EC2 Instance**

   ```bash
   # Connect to your EC2 instance
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Install Node.js and PM2**

   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2
   ```

3. **Clone and setup application**

   ```bash
   git clone <your-repo>
   cd performance360/backend
   npm install
   npm run build
   ```

4. **Create environment file**

   ```bash
   sudo nano .env
   ```

   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@your-rds-endpoint:5432/db
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=https://your-frontend-url.com
   ```

5. **Setup PM2**

   ```bash
   # Create ecosystem file
   pm2 ecosystem
   ```

   Edit `ecosystem.config.js`:

   ```javascript
   module.exports = {
     apps: [
       {
         name: 'feedback-app-backend',
         script: 'dist/index.js',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
         },
       },
     ],
   };
   ```

6. **Start application**

   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx (optional)**

   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/feedback-app
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/feedback-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🔧 Production Configuration

### Environment Variables

**Required:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=https://your-frontend-domain.com
```

**Optional:**

```env
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Security Best Practices

1. **JWT Secret**
   - Use a strong, random secret (at least 32 characters)
   - Store securely and rotate regularly
   - Never commit to version control

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access
   - Regular backups

3. **CORS Configuration**
   - Only allow your frontend domain
   - Don't use `*` in production

4. **Rate Limiting**
   - Adjust limits based on your needs
   - Monitor for abuse

### Performance Optimization

1. **Database**
   - Add indexes for frequently queried fields
   - Use connection pooling
   - Monitor query performance

2. **Application**
   - Enable compression
   - Use caching where appropriate
   - Monitor memory usage

3. **Monitoring**
   - Set up logging (Winston/Pino)
   - Monitor application metrics
   - Set up alerts for errors

## 📊 Monitoring and Logging

### Winston Logger Setup

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'feedback-app-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

### Health Checks

```bash
# Check application health
curl http://your-domain.com/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.14
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**

   ```bash
   # Check database connection
   npm run db:studio

   # Reset database
   npm run db:push --force-reset
   ```

2. **Port Already in Use**

   ```bash
   # Find process using port
   lsof -i :5000

   # Kill process
   kill -9 <PID>
   ```

3. **Memory Issues**

   ```bash
   # Check memory usage
   pm2 monit

   # Restart application
   pm2 restart feedback-app-backend
   ```

4. **Logs**

   ```bash
   # View application logs
   pm2 logs feedback-app-backend

   # View error logs
   tail -f error.log
   ```

### Support

For deployment issues:

1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure database is accessible
4. Check network connectivity
5. Review security group/firewall settings
