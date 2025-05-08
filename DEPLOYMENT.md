# Deployment Guide

This document provides instructions for deploying the Online Casino application to a production server environment.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (or Supabase account)
- Git
- A server with SSH access (like DigitalOcean VPS)

## Database Setup

### Option 1: Supabase

1. Sign up for Supabase at https://supabase.io/
2. Create a new project
3. Navigate to Settings > Database
4. Copy the connection string (URI or connection pooling URI)
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Option 2: Self-hosted PostgreSQL

1. Install PostgreSQL on your server
2. Create a new database and user
3. Set up the connection string in the format:
   ```
   postgresql://username:password@localhost:5432/database_name
   ```

## Server Setup

1. SSH into your server:
   ```bash
   ssh user@your-server-ip
   ```

2. Install Node.js and npm (if not already installed):
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

6. Edit the `.env` file with your production settings:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=your_database_connection_string
   ENABLE_LOGGING=true
   CORS_ORIGIN=*
   ```

7. Run database migrations:
   ```bash
   npm run db:push
   ```

8. Seed the database (if needed):
   ```bash
   npm run db:seed
   ```

9. Build the client:
   ```bash
   npm run build
   ```

## Running the Application

### Option 1: Using PM2 (recommended for production)

1. Install PM2:
   ```bash
   npm install -g pm2
   ```

2. Start the application:
   ```bash
   pm2 start npm --name "casino-app" -- start
   ```

3. Configure PM2 to start on boot:
   ```bash
   pm2 startup
   pm2 save
   ```

### Option 2: Using systemd

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/casino-app.service
   ```

2. Add the following content:
   ```
   [Unit]
   Description=Online Casino App
   After=network.target

   [Service]
   User=your-username
   WorkingDirectory=/path/to/your/app
   Environment=NODE_ENV=production
   ExecStart=/usr/bin/npm start
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable casino-app
   sudo systemctl start casino-app
   ```

## Setting Up a Reverse Proxy (Optional but recommended)

### Using Nginx

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create a site configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/casino-app
   ```

3. Add the following configuration:
   ```
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

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

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/casino-app /etc/nginx/sites-enabled/
   ```

5. Test the configuration:
   ```bash
   sudo nginx -t
   ```

6. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

## SSL Setup with Let's Encrypt

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtain an SSL certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. Follow the prompts to complete the certificate setup

## Troubleshooting

### Check Application Logs
```bash
# If using PM2
pm2 logs casino-app

# If using systemd
sudo journalctl -u casino-app
```

### Check Database Connection
Make sure your DATABASE_URL is correctly set in the .env file and that your server can connect to the database.

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Maintenance

### Updating the Application
```bash
cd /path/to/your/app
git pull
npm install
npm run build
```

Then restart the application:
```bash
# If using PM2
pm2 restart casino-app

# If using systemd
sudo systemctl restart casino-app
```