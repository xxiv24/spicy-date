# 🚀 Deployment Guide - Spicy Date

راهنمای به‌کار گیری برنامه در محیط Production

## 📋 فهرست

1. [Heroku](#heroku)
2. [DigitalOcean](#digitalocean)
3. [AWS](#aws)
4. [Docker](#docker)
5. [Vercel (Frontend)](#vercel)

---

## 🔴 Heroku

### پیش‌نیازها
- اکانت Heroku
- Heroku CLI نصب شده

### مراحل

#### 1. Login به Heroku
```bash
heroku login
```

#### 2. ایجاد App
```bash
heroku create spicy-date-app
```

#### 3. تنظیم Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/spicy-date
```

#### 4. Deploy
```bash
git push heroku main
```

#### 5. بررسی Logs
```bash
heroku logs --tail
```

---

## 🔵 DigitalOcean

### پیش‌نیازها
- DigitalOcean Account
- Droplet (Ubuntu 20.04+)
- SSH Key

### مراحل

#### 1. SSH به Droplet
```bash
ssh root@your_droplet_ip
```

#### 2. نصب Node.js و npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. نصب MongoDB
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

#### 4. Clone Repository
```bash
cd /var/www
git clone https://github.com/yourusername/spicy-date.git
cd spicy-date
npm install
```

#### 5. نصب PM2
```bash
npm install -g pm2
pm2 start server.js --name "spicy-date"
pm2 startup
pm2 save
```

#### 6. نصب Nginx
```bash
sudo apt-get install -y nginx
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo systemctl restart nginx
```

#### 7. SSL with Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

---

## 🟠 AWS

### پیش‌نیازها
- AWS Account
- EC2 Instance (t3.micro or larger)
- RDS for MongoDB (optional)

### مراحل

#### 1. Launch EC2 Instance
- AMI: Ubuntu 20.04 LTS
- Instance Type: t3.micro
- Security Group: Allow ports 22, 80, 443

#### 2. Connect و Setup
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
sudo apt update && sudo apt upgrade -y
```

#### 3. نصب Dependencies
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx mongodb
```

#### 4. Deploy Application
```bash
cd /home/ubuntu
git clone your-repo-url
cd spicy-date
npm install --production
```

#### 5. Configure PM2
```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

#### 6. Nginx Configuration
```bash
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo systemctl restart nginx
```

---

## 🐳 Docker

### Local Testing
```bash
docker-compose up --build
```

### Deploy to Docker Hub

#### 1. Build Image
```bash
docker build -t yourusername/spicy-date:latest .
```

#### 2. Push to Registry
```bash
docker login
docker push yourusername/spicy-date:latest
```

#### 3. Pull & Run
```bash
docker pull yourusername/spicy-date:latest
docker run -p 5000:5000 -e NODE_ENV=production yourusername/spicy-date:latest
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spicy-date
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spicy-date
  template:
    metadata:
      labels:
        app: spicy-date
    spec:
      containers:
      - name: spicy-date
        image: yourusername/spicy-date:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: spicy-date-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## 🟣 Vercel (Frontend)

### برای Hosting HTML Static

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
vercel --prod
```

#### 3. تنظیمات

`vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-api-domain.com/api/:path*"
    }
  ]
}
```

---

## 📊 Production Checklist

- [ ] Environment variables تنظیم شده‌اند
- [ ] Database backup فعال است
- [ ] SSL/HTTPS فعال است
- [ ] Rate limiting فعال است
- [ ] Logging configured
- [ ] Monitoring setup (New Relic, DataDog)
- [ ] Error tracking (Sentry)
- [ ] CDN برای Static files
- [ ] Database indexes optimized
- [ ] API documentation ready
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API versioning ready
- [ ] Backup & recovery plan

---

## 🔒 Security Checklist

```bash
# 1. Update System
sudo apt update && sudo apt upgrade -y

# 2. Setup Firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. Disable Root Login
sudo passwd -l root

# 4. Setup SSH Keys
ssh-copy-id -i ~/.ssh/id_rsa.pub user@host

# 5. Install Fail2Ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
```

---

## 📈 Performance Optimization

### Caching
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Compression
```javascript
// server.js
const compression = require('compression');
app.use(compression());
```

### Connection Pooling
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5
});
```

---

## 📞 Monitoring & Logging

### PM2 Plus
```bash
pm2 install pm2-auto-pull
pm2 link <pm2_secret_key> <pm2_public_key>
```

### ELK Stack (Optional)
```bash
docker run -d --name elasticsearch docker.elastic.co/elasticsearch/elasticsearch:8.0.0
docker run -d --name kibana docker.elastic.co/kibana/kibana:8.0.0
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions
`.github/workflows/deploy.yml`:
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
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - name: Deploy
        run: |
          git remote set-url origin https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}
          npm run deploy
```

---

## 📱 Telegram Bot Integration

### Setup Bot Webhook
```bash
curl -F "url=https://your-domain.com/telegram/webhook" \
     -F "certificate=@certificate.pem" \
     https://api.telegram.org/bot<TOKEN>/setWebhook
```

---

## ❓ Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :5000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test MongoDB
mongo --host localhost --port 27017

# Or with Mongoose
node -e "require('mongoose').connect('mongodb://localhost/test')"
```

### Memory Issues
```bash
# Check memory usage
free -h

# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

**آخرین بروزرسانی**: آگوست 2024
