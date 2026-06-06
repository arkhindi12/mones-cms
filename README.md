# Mones CMS

**Deskripsi:** CMS Admin Dashboard for MG Mones Galery (Jasa Desain & Bangun Rumah Jabodetabek)  
**URL:** https://mones.arzastore.com  
**Port:** 3010 (backend API)  
**Tech Stack:** Node.js + Express + JSON file storage

## Fitur
- Content management untuk website MG Mones Galery
- Admin dashboard untuk manage projects/portofolio
- Image upload & gallery management
- JSON-based data storage (lightweight CMS)

## Database
- Type: JSON files (di folder `data/`)
- Backup: `backups/*.json` atau seluruh `data/` folder

## URL & Access
- Admin Dashboard: https://mones.arzastore.com/admin
- Public Website: https://mones.arzastore.com
- Static Root: `/var/www/mones.arzastore.com` (frontend)

## Backup
Otomatis **00:00 WIB** setiap hari:
- Source code → GitHub
- Data files → `backups/`

## Restore di VPS Baru

### 1. Clone
```bash
cd /opt
git clone git@github.com:arkhindi12/mones-cms.git
cd mones-cms
```

### 2. Install
```bash
npm install
```

### 3. Restore data
```bash
cp -r backups/data_* data/
# atau manual copy JSON files
```

### 4. Environment
```bash
cp .env.example .env
nano .env
# Set PORT=3010, UPLOAD_DIR, ADMIN_PASSWORD
```

### 5. Setup uploads directory
```bash
mkdir -p uploads
chmod 755 uploads
```

### 6. Start
```bash
pm2 start ecosystem.config.js --name mones-cms
pm2 save
```

### 7. Setup static frontend (if separate)
```bash
# Frontend static di /var/www/mones.arzastore.com
sudo mkdir -p /var/www/mones.arzastore.com
sudo chown -R $USER:$USER /var/www/mones.arzastore.com
# Copy frontend files ke sana
```

### 8. Nginx config
```bash
sudo nano /etc/nginx/sites-available/mones.arzastore.com
```

Config:
```nginx
server {
    listen 80;
    server_name mones.arzastore.com;
    
    # Frontend static
    root /var/www/mones.arzastore.com;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Admin
    location /admin {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mones.arzastore.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 9. SSL
```bash
sudo certbot --nginx -d mones.arzastore.com
```

### 10. Verify
```bash
pm2 logs mones-cms
curl http://localhost:3010/api/health
curl https://mones.arzastore.com
```

---
*Auto-backup enabled. Last update: 2026-06-06*
