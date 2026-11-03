# 🚀 AuditWeave by Axoreon — Oracle VPS Deployment Guide (Ubuntu)

> **Complete production deployment on an Oracle Cloud VPS running Ubuntu, with GitHub-based auto-deploy, Nginx reverse proxy, SSL, and zero-downtime updates.**

> [!IMPORTANT]
> This guide assumes your VPS is **already running other services/websites**. All AuditWeave services use unique ports that won't conflict with your existing stack.

---

## 📋 Table of Contents

1. [Architecture Overview](#1--architecture-overview)
2. [Port Allocation Map](#2--port-allocation-map)
3. [Prerequisites & VPS Preparation](#3--prerequisites--vps-preparation)
4. [Oracle Cloud Firewall Rules](#4--oracle-cloud-firewall-rules)
5. [Install Required Software](#5--install-required-software)
6. [Clone the GitHub Repository](#6--clone-the-github-repository)
7. [Set Up the Backend (FastAPI + Python)](#7--set-up-the-backend-fastapi--python)
8. [Set Up the Frontend (Next.js)](#8--set-up-the-frontend-nextjs)
9. [Create Systemd Services (Auto-Start on Reboot)](#9--create-systemd-services-auto-start-on-reboot)
10. [Configure Nginx Reverse Proxy + SSL](#10--configure-nginx-reverse-proxy--ssl)
11. [GitHub Auto-Deploy Script](#11--github-auto-deploy-script)
12. [GitHub Webhook (Automatic Pull on Push)](#12--github-webhook-automatic-pull-on-push)
13. [Database Backup Strategy](#13--database-backup-strategy)
14. [Monitoring & Logs](#14--monitoring--logs)
15. [Common Commands Cheat Sheet](#15--common-commands-cheat-sheet)
16. [Troubleshooting](#16--troubleshooting)

---

## 1. 🏗 Architecture Overview

```mermaid
flowchart LR
    User["🌐 User Browser"] -->|HTTPS :443| Nginx["Nginx Reverse Proxy"]
    Nginx -->|proxy_pass :4500| Frontend["Next.js Frontend\n(Port 4500)"]
    Nginx -->|proxy_pass :4501| Backend["FastAPI Backend\n(Port 4501)"]
    Frontend -->|API calls| Backend
    Backend -->|Read/Write| DB["SQLite / PostgreSQL"]
    Backend -->|API| Gemini["Google Gemini API"]
    Backend -->|API| Razorpay["Razorpay Payments"]
    Backend -->|SMTP| Email["Email Service"]
    GH["GitHub Repo"] -->|webhook POST :4510| Webhook["Deploy Webhook\n(Port 4510)"]
    Webhook -->|git pull + restart| Frontend
    Webhook -->|git pull + restart| Backend
```

---

## 2. 🔌 Port Allocation Map

> [!NOTE]
> These ports are chosen to avoid conflicts with common services you may already be running (80, 443, 3000, 5000, 8000, 8080, etc.)

| Service | Internal Port | Exposed Via | Purpose |
|---|---|---|---|
| **AuditWeave Frontend** (Next.js) | `4500` | Nginx → `https://yourdomain.com` | Production Next.js standalone server |
| **AuditWeave Backend** (FastAPI) | `4501` | Nginx → `https://yourdomain.com/api` | FastAPI Uvicorn server |
| **Deploy Webhook Listener** | `4510` | Direct (firewall open) | Receives GitHub webhook for auto-deploy |
| **Nginx** (shared) | `80 / 443` | Public | Reverse proxy + SSL termination |

---

## 3. 📦 Prerequisites & VPS Preparation

### 3.1 SSH into your Oracle VPS

```bash
ssh ubuntu@YOUR_VPS_PUBLIC_IP
```

### 3.2 Update the system

```bash
sudo apt update && sudo apt upgrade -y
```

### 3.3 Set timezone (India)

```bash
sudo timedatectl set-timezone Asia/Kolkata
```

### 3.4 Create a dedicated deploy user (optional but recommended)

```bash
sudo adduser auditweave --disabled-password --gecos ""
sudo usermod -aG sudo auditweave
```

> [!TIP]
> If you're comfortable running as `ubuntu` user, skip this step and use `ubuntu` everywhere below.

---

## 4. 🔥 Oracle Cloud Firewall Rules

Oracle Cloud has **two layers** of firewall. You MUST configure both.

### 4.1 Oracle Cloud Console — Virtual Cloud Network (VCN) Security List

Go to: **Networking → Virtual Cloud Networks → Your VCN → Security Lists → Default Security List**

Add **Ingress Rules**:

| Source CIDR | Protocol | Dest Port | Description |
|---|---|---|---|
| `0.0.0.0/0` | TCP | `80` | HTTP (if not already open) |
| `0.0.0.0/0` | TCP | `443` | HTTPS (if not already open) |
| `0.0.0.0/0` | TCP | `4510` | GitHub Webhook Listener |

### 4.2 Ubuntu iptables (Oracle Ubuntu images use iptables, NOT ufw)

```bash
# Allow HTTP/HTTPS (likely already open if other sites run)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Allow webhook port
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4510 -j ACCEPT

# Save iptables rules so they persist across reboots
sudo netfilter-persistent save
```

> [!CAUTION]
> Oracle Cloud Ubuntu images use `iptables` by default, **not UFW**. If you enable `ufw` it will conflict and lock you out. Stick with `iptables`.

---

## 5. 🛠 Install Required Software

### 5.1 Install Node.js 20 LTS (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Should show v20.x
npm -v
```

### 5.2 Install Python 3.11+ and pip

```bash
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential
python3 --version  # Should show 3.11+
```

### 5.3 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5.4 Install Certbot (for free SSL via Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.5 Install Git (likely already installed)

```bash
sudo apt install -y git
git --version
```

### 5.6 Install required system fonts (for PDF generation)

```bash
sudo apt install -y fonts-dejavu-core fonts-dejavu
```

---

## 6. 📥 Clone the GitHub Repository

### 6.1 Set up SSH key for GitHub (recommended for private repos)

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
```

Copy the output and add it to: **GitHub → Settings → SSH and GPG Keys → New SSH Key**

### 6.2 Clone the repository

```bash
# Create a project directory
sudo mkdir -p /var/www/auditweave
sudo chown $USER:$USER /var/www/auditweave

# Clone
cd /var/www/auditweave
git clone git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git .
```

> [!NOTE]
> If using HTTPS instead of SSH:
> ```bash
> git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .
> ```
> For private repos with HTTPS, configure a Personal Access Token (PAT):
> ```bash
> git remote set-url origin https://YOUR_PAT@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
> ```

---

## 7. ⚙️ Set Up the Backend (FastAPI + Python)

### 7.1 Create Python virtual environment

```bash
cd /var/www/auditweave/backend
python3 -m venv .venv
source .venv/bin/activate
```

### 7.2 Install Python dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 7.3 Create the production `.env` file

```bash
nano /var/www/auditweave/backend/.env
```

Paste and fill in your values:

```env
# ─── Database ───
# Option A: SQLite (simplest, good for initial deployment)
DATABASE_URL=sqlite:///./AuditWeave.db

# Option B: PostgreSQL (recommended for production scale)
# DATABASE_URL=postgresql+psycopg://auditweave_user:YOUR_STRONG_PASSWORD@localhost:5432/auditweave_db

# ─── Security ───
JWT_SECRET=GENERATE_A_LONG_RANDOM_STRING_HERE

# ─── AI Engine ───
GEMINI_API_KEY=your_gemini_api_key_here

# ─── Payments (Razorpay) ───
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ─── Email (Resend) ───
RESEND_API_KEY=re_your_resend_api_key
CONTACT_ADMIN_EMAIL=admin@yourdomain.com
CONTACT_FROM_EMAIL=AuditWeave <noreply@yourdomain.com>
RECEIPT_EMAIL_FROM=AuditWeave <receipts@yourdomain.com>

# ─── SMTP (Email OTP for Signup Verification) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_app_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=AuditWeave
SMTP_USE_TLS=true

# ─── Credits ───
CREDIT_RESERVATION_TIMEOUT_MINUTES=360
```

> [!TIP]
> Generate a strong JWT secret:
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(64))"
> ```

### 7.4 Run database migrations (Alembic)

```bash
cd /var/www/auditweave/backend
source .venv/bin/activate
alembic upgrade head
```

### 7.5 Test the backend manually

```bash
cd /var/www/auditweave/backend
source .venv/bin/activate
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 4501
```

Visit `http://YOUR_VPS_IP:4501/docs` — you should see the FastAPI Swagger docs. Press `Ctrl+C` to stop.

---

## 8. 🎨 Set Up the Frontend (Next.js)

### 8.1 Create the production `.env` file

```bash
nano /var/www/auditweave/frontend/.env
```

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
```

> [!IMPORTANT]
> `NEXT_PUBLIC_API_URL` must point to your **production domain** (not `localhost`). The frontend code prefixes all API calls with this URL + `/api`.

### 8.2 Add standalone output mode to `next.config.ts`

Your frontend Dockerfile already copies `.next/standalone`, so ensure `next.config.ts` has the `output: "standalone"` setting:

```bash
nano /var/www/auditweave/frontend/next.config.ts
```

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

### 8.3 Install dependencies and build

```bash
cd /var/www/auditweave/frontend
npm install --legacy-peer-deps
npm run build
```

### 8.4 Test the frontend manually

```bash
cd /var/www/auditweave/frontend/.next/standalone
PORT=4500 node server.js
```

Visit `http://YOUR_VPS_IP:4500` — you should see the AuditWeave UI. Press `Ctrl+C` to stop.

---

## 9. 🔄 Create Systemd Services (Auto-Start on Reboot)

### 9.1 Backend Service

```bash
sudo nano /etc/systemd/system/auditweave-backend.service
```

```ini
[Unit]
Description=AuditWeave Backend (FastAPI/Uvicorn)
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/auditweave/backend
EnvironmentFile=/var/www/auditweave/backend/.env
ExecStart=/var/www/auditweave/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 4501 --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 9.2 Frontend Service

```bash
sudo nano /etc/systemd/system/auditweave-frontend.service
```

```ini
[Unit]
Description=AuditWeave Frontend (Next.js Standalone)
After=network.target auditweave-backend.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/auditweave/frontend/.next/standalone
Environment=NODE_ENV=production
Environment=PORT=4500
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 9.3 Enable and start both services

```bash
sudo systemctl daemon-reload
sudo systemctl enable auditweave-backend
sudo systemctl enable auditweave-frontend
sudo systemctl start auditweave-backend
sudo systemctl start auditweave-frontend
```

### 9.4 Check status

```bash
sudo systemctl status auditweave-backend
sudo systemctl status auditweave-frontend
```

---

## 10. 🌐 Configure Nginx Reverse Proxy + SSL

### 10.1 Create Nginx server block

```bash
sudo nano /etc/nginx/sites-available/auditweave
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL (Certbot will fill these in, placeholder for now)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Max upload size (for PDF/DOCX policy file uploads)
    client_max_body_size 25M;

    # ─── Backend API ───
    location /api/ {
        proxy_pass http://127.0.0.1:4501/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # ─── Frontend (Next.js) ───
    location / {
        proxy_pass http://127.0.0.1:4500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ─── Next.js Static Assets ───
    location /_next/static/ {
        proxy_pass http://127.0.0.1:4500;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 10.2 Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/auditweave /etc/nginx/sites-enabled/
sudo nginx -t    # Test configuration
sudo systemctl reload nginx
```

### 10.3 Get SSL certificate with Certbot

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically:
- Obtain the certificate
- Update your Nginx config with SSL paths
- Set up auto-renewal via a systemd timer

### 10.4 Verify auto-renewal

```bash
sudo certbot renew --dry-run
```

---

## 11. 📦 GitHub Auto-Deploy Script

### 11.1 Create the deploy script

```bash
nano /var/www/auditweave/deploy.sh
```

```bash
#!/bin/bash
# ============================================
# AuditWeave Auto-Deploy Script
# Pulls latest code from GitHub and restarts
# ============================================

set -e

PROJECT_DIR="/var/www/auditweave"
LOG_FILE="/var/log/auditweave-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== DEPLOY STARTED =========="

# 1. Pull latest code
cd "$PROJECT_DIR"
log "Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/main   # Change 'main' to your branch name
log "Git pull complete."

# 2. Backend: Update dependencies
log "Updating backend dependencies..."
cd "$PROJECT_DIR/backend"
source .venv/bin/activate
pip install -r requirements.txt --quiet
log "Backend dependencies updated."

# 3. Backend: Run migrations
log "Running database migrations..."
alembic upgrade head 2>&1 | tee -a "$LOG_FILE" || log "WARNING: Migration step had issues"
deactivate
log "Migrations complete."

# 4. Frontend: Install deps + rebuild
log "Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install --legacy-peer-deps --silent
npm run build
log "Frontend build complete."

# 5. Copy static assets into standalone
log "Syncing static assets..."
cp -r "$PROJECT_DIR/frontend/public" "$PROJECT_DIR/frontend/.next/standalone/public" 2>/dev/null || true
cp -r "$PROJECT_DIR/frontend/.next/static" "$PROJECT_DIR/frontend/.next/standalone/.next/static" 2>/dev/null || true
log "Static assets synced."

# 6. Restart services
log "Restarting services..."
sudo systemctl restart auditweave-backend
sleep 3
sudo systemctl restart auditweave-frontend
log "Services restarted."

# 7. Health check
sleep 5
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4501/docs || echo "000")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4500 || echo "000")

if [ "$BACKEND_STATUS" = "200" ] && [ "$FRONTEND_STATUS" = "200" ]; then
    log "✅ Health check PASSED — Backend: $BACKEND_STATUS, Frontend: $FRONTEND_STATUS"
else
    log "⚠️  Health check WARNING — Backend: $BACKEND_STATUS, Frontend: $FRONTEND_STATUS"
fi

log "========== DEPLOY COMPLETE =========="
```

```bash
chmod +x /var/www/auditweave/deploy.sh
```

### 11.2 Allow passwordless sudo for service restarts

```bash
sudo visudo -f /etc/sudoers.d/auditweave-deploy
```

Add:

```
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart auditweave-backend
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart auditweave-frontend
```

### 11.3 Manual deploy (pull + restart)

Whenever you push code to GitHub, SSH into VPS and run:

```bash
cd /var/www/auditweave && ./deploy.sh
```

---

## 12. 🔔 GitHub Webhook (Automatic Pull on Push)

> [!NOTE]
> This makes it **fully automatic** — push to GitHub → VPS detects it → pulls code → rebuilds → restarts. No manual SSH needed.

### 12.1 Install the webhook listener

```bash
sudo apt install -y webhook
```

### 12.2 Create webhook config

```bash
sudo mkdir -p /etc/webhook
sudo nano /etc/webhook/hooks.json
```

```json
[
  {
    "id": "auditweave-deploy",
    "execute-command": "/var/www/auditweave/deploy.sh",
    "command-working-directory": "/var/www/auditweave",
    "response-message": "AuditWeave deploy triggered.",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hmac-sha256",
            "secret": "YOUR_WEBHOOK_SECRET_HERE",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/main",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
```

> [!IMPORTANT]
> Replace `YOUR_WEBHOOK_SECRET_HERE` with a strong random secret. Generate one:
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(32))"
> ```
> Change `refs/heads/main` to your branch name if different.

### 12.3 Create the webhook systemd service

```bash
sudo nano /etc/systemd/system/auditweave-webhook.service
```

```ini
[Unit]
Description=AuditWeave GitHub Webhook Listener
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/bin/webhook -hooks /etc/webhook/hooks.json -port 4510 -verbose
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable auditweave-webhook
sudo systemctl start auditweave-webhook
```

### 12.4 Configure GitHub webhook

Go to: **GitHub → Your Repo → Settings → Webhooks → Add webhook**

| Field | Value |
|---|---|
| Payload URL | `http://YOUR_VPS_IP:4510/hooks/auditweave-deploy` |
| Content type | `application/json` |
| Secret | Same `YOUR_WEBHOOK_SECRET_HERE` from step 12.2 |
| Events | Just the push event |
| Active | ✅ |

---

## 13. 💾 Database Backup Strategy

### 13.1 For SQLite

```bash
sudo nano /etc/cron.d/auditweave-backup
```

```cron
# Daily backup at 2 AM IST
0 2 * * * ubuntu cp /var/www/auditweave/backend/AuditWeave.db /var/www/auditweave/backups/AuditWeave-$(date +\%Y\%m\%d-\%H\%M\%S).db
# Weekly cleanup: keep last 30 days
0 3 * * 0 ubuntu find /var/www/auditweave/backups/ -name "*.db" -mtime +30 -delete
```

```bash
mkdir -p /var/www/auditweave/backups
```

### 13.2 For PostgreSQL (if you upgrade later)

```bash
# Add to cron
0 2 * * * ubuntu pg_dump -U auditweave_user auditweave_db | gzip > /var/www/auditweave/backups/auditweave-$(date +\%Y\%m\%d).sql.gz
```

---

## 14. 📊 Monitoring & Logs

### View service logs

```bash
# Backend logs (live tail)
sudo journalctl -u auditweave-backend -f

# Frontend logs (live tail)
sudo journalctl -u auditweave-frontend -f

# Webhook logs
sudo journalctl -u auditweave-webhook -f

# Deploy logs
tail -f /var/log/auditweave-deploy.log

# Nginx access/error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check service health

```bash
# All AuditWeave services at a glance
systemctl status auditweave-backend auditweave-frontend auditweave-webhook

# Quick health check
curl -s http://127.0.0.1:4501/docs | head -5
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4500
```

---

## 15. 📝 Common Commands Cheat Sheet

| Task | Command |
|---|---|
| **Manual deploy** | `cd /var/www/auditweave && ./deploy.sh` |
| **Restart backend** | `sudo systemctl restart auditweave-backend` |
| **Restart frontend** | `sudo systemctl restart auditweave-frontend` |
| **Restart both** | `sudo systemctl restart auditweave-backend auditweave-frontend` |
| **Stop everything** | `sudo systemctl stop auditweave-backend auditweave-frontend auditweave-webhook` |
| **View backend logs** | `sudo journalctl -u auditweave-backend -f` |
| **View frontend logs** | `sudo journalctl -u auditweave-frontend -f` |
| **View deploy logs** | `tail -f /var/log/auditweave-deploy.log` |
| **Check disk space** | `df -h` |
| **Check memory usage** | `free -h` |
| **Check running ports** | `sudo ss -tlnp` |
| **Pull manually** | `cd /var/www/auditweave && git pull origin main` |
| **Rebuild frontend only** | `cd /var/www/auditweave/frontend && npm run build && sudo systemctl restart auditweave-frontend` |
| **Renew SSL** | `sudo certbot renew` |
| **Test Nginx config** | `sudo nginx -t && sudo systemctl reload nginx` |

---

## 16. 🔧 Troubleshooting

### ❌ Backend won't start
```bash
# Check logs
sudo journalctl -u auditweave-backend -n 50 --no-pager

# Common fix: missing environment variables
cat /var/www/auditweave/backend/.env

# Common fix: permission issues
sudo chown -R ubuntu:ubuntu /var/www/auditweave
```

### ❌ Frontend build fails
```bash
# Check Node.js version (need v18+)
node -v

# Clear cache and rebuild
cd /var/www/auditweave/frontend
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### ❌ 502 Bad Gateway from Nginx
```bash
# Check if services are actually running
sudo ss -tlnp | grep -E "4500|4501"

# If not running, restart
sudo systemctl restart auditweave-backend auditweave-frontend
```

### ❌ CORS errors in browser
Update the CORS origins in `backend/app/main.py`:
```python
allow_origins=[
    "http://localhost:3000",
    "https://yourdomain.com",
    "https://www.yourdomain.com",
],
```
Then redeploy.

### ❌ Webhook not triggering
```bash
# Check webhook service
sudo journalctl -u auditweave-webhook -f

# Test manually
curl -X POST http://127.0.0.1:4510/hooks/auditweave-deploy
```

### ❌ Out of memory during `npm run build`
```bash
# Add swap space (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Then retry
cd /var/www/auditweave/frontend && npm run build
```

---

## ✅ Complete Deployment Checklist

- [ ] SSH into Oracle VPS
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Oracle Cloud VCN Security List — ports 80, 443, 4510 open
- [ ] Ubuntu iptables — ports 80, 443, 4510 allowed
- [ ] Node.js 20 installed
- [ ] Python 3.11+ installed
- [ ] Nginx installed and running
- [ ] Git installed, SSH key added to GitHub
- [ ] Repository cloned to `/var/www/auditweave`
- [ ] Backend `.env` created and filled
- [ ] Backend venv created, dependencies installed
- [ ] Database migrations run (`alembic upgrade head`)
- [ ] Frontend `.env` created (`NEXT_PUBLIC_API_URL=https://yourdomain.com`)
- [ ] `next.config.ts` has `output: "standalone"`
- [ ] Frontend built (`npm run build`)
- [ ] `auditweave-backend.service` created and enabled
- [ ] `auditweave-frontend.service` created and enabled
- [ ] Both services started and healthy
- [ ] Nginx server block configured
- [ ] SSL certificate obtained (`certbot --nginx`)
- [ ] Site accessible at `https://yourdomain.com`
- [ ] Deploy script created and tested
- [ ] Webhook listener installed and running
- [ ] GitHub webhook configured
- [ ] CORS origins updated for production domain
- [ ] Database backup cron configured
- [ ] Swap space added (if < 4GB RAM)

---

> [!TIP]
> **Quick first-time deploy sequence** (copy-paste friendly):
> ```bash
> # After SSH and all software is installed:
> cd /var/www/auditweave
> git clone git@github.com:YOUR_USER/YOUR_REPO.git .
> 
> # Backend
> cd backend && python3 -m venv .venv && source .venv/bin/activate
> pip install -r requirements.txt && alembic upgrade head && deactivate
> 
> # Frontend
> cd ../frontend && npm install --legacy-peer-deps && npm run build
> 
> # Start services
> sudo systemctl start auditweave-backend auditweave-frontend
> ```

---

*Last updated: November 2026 | AuditWeave by Axoreon*
