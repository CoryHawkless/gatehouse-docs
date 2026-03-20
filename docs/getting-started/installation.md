---
id: installation
title: Installation
sidebar_position: 2
---

# Installation

This guide covers all installation options for Secuird.

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Python | 3.11 | 3.12+ |
| PostgreSQL | 14 | 15+ |
| Redis | 6 | 7+ |
| RAM | 512 MB | 2 GB+ |
| Disk | 1 GB | 10 GB+ (for audit logs) |

---

## Option A: Local / Development

Follow the [Quick Start guide](/docs/getting-started/quickstart) for local installation.

---

## Option B: Docker Compose

The `lab/` directory contains a Docker Compose file for running the full stack locally.

```yaml title="docker-compose.yaml (excerpt)"
services:
  api:
    build:
      context: ../Secuird-api
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/Secuird
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: Secuird
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
```

```bash
cd lab
docker compose up -d
docker compose exec api flask db upgrade
```

---

## Option C: Production (bare metal / VM)

### 1. Install system dependencies

```bash
# Debian/Ubuntu
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip postgresql redis-server
```

### 2. Create a dedicated user

```bash
sudo useradd -m -s /bin/bash Secuird
sudo su - Secuird
```

### 3. Clone and install

```bash
git clone https://github.com/CoryHawkless/gatehouse-api.git /opt/Secuird
cd /opt/Secuird/Secuird-api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements/production.txt
```

### 4. Configure environment

```bash
cp .env.example /etc/Secuird.env
# Edit /etc/Secuird.env with your production values
```

### 5. Run migrations

```bash
source /etc/Secuird.env
flask db upgrade
```

### 6. Set up a systemd service

```ini title="/etc/systemd/system/Secuird.service"
[Unit]
Description=Secuird API
After=network.target postgresql.service redis.service

[Service]
User=Secuird
WorkingDirectory=/opt/Secuird/Secuird-api
EnvironmentFile=/etc/Secuird.env
ExecStart=/opt/Secuird/Secuird-api/.venv/bin/gunicorn \
    --bind 127.0.0.1:5000 \
    --workers 4 \
    --worker-class gevent \
    wsgi:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now Secuird
```

### 7. Configure nginx reverse proxy

```nginx title="/etc/nginx/sites-available/Secuird"
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

---

## Running database migrations

Secuird uses **Alembic** (via Flask-Migrate) for database schema migrations.

```bash
# Apply all pending migrations
flask db upgrade

# Check current migration version
flask db current

# Create a new migration (after changing models)
flask db migrate -m "add user preferences table"

# Rollback one migration
flask db downgrade
```

:::caution Production migrations
Always take a database backup before running `flask db upgrade` in production. Test migrations on a staging environment first.
:::

---

## Requirements files

| File | Use case |
|------|----------|
| `requirements/base.txt` | Core runtime dependencies |
| `requirements/development.txt` | Base + dev tools (pytest, coverage, etc.) |
| `requirements/production.txt` | Base + production server (gunicorn, gevent) |
| `requirements.txt` | Alias for base (convenience) |
