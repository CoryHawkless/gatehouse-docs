---
id: self-hosting
title: Self-Hosting Guide
sidebar_position: 1
---

# Self-Hosting Guide

This guide covers deploying Secuird to production.

---

## Production Checklist

Before going live, ensure you have:

- [ ] Strong `SECRET_KEY`, `ENCRYPTION_KEY`, `CA_ENCRYPTION_KEY` set
- [ ] PostgreSQL with proper credentials and backups configured
- [ ] Redis with persistence enabled (`appendonly yes`)
- [ ] HTTPS with a valid TLS certificate
- [ ] `OIDC_ISSUER_URL` set to your public HTTPS URL
- [ ] `WEBAUTHN_RP_ID` set to your domain
- [ ] `CORS_ORIGINS` set to your frontend URL only
- [ ] Rate limiting enabled (`RATELIMIT_ENABLED=True`)
- [ ] Log collection configured
- [ ] Database backup schedule in place

---

## Environment Variables (Production)

```bash title="/etc/Secuird.env"
# ── Core ─────────────────────────────────────────────────────────
FLASK_ENV=production
APP_URL=https://app.yourdomain.com
SECRET_KEY=<random 64-char string>
LOG_LEVEL=INFO
LOG_TO_STDOUT=True

# ── Database ──────────────────────────────────────────────────────
DATABASE_URL=postgresql://Secuird:strongpassword@db.internal:5432/Secuird

# ── Redis ─────────────────────────────────────────────────────────
REDIS_URL=redis://:redispassword@redis.internal:6379/0
RATELIMIT_STORAGE_URL=redis://:redispassword@redis.internal:6379/1

# ── Security ──────────────────────────────────────────────────────
ENCRYPTION_KEY=<random 64-char string>
CA_ENCRYPTION_KEY=<random 64-char string>
BCRYPT_LOG_ROUNDS=12

# ── Sessions ──────────────────────────────────────────────────────
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_SAMESITE=None

# ── CORS ──────────────────────────────────────────────────────────
CORS_ORIGINS=https://app.yourdomain.com

# ── OIDC ──────────────────────────────────────────────────────────
OIDC_ISSUER_URL=https://auth.yourdomain.com

# ── WebAuthn ──────────────────────────────────────────────────────
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_RP_NAME=Secuird
WEBAUTHN_ORIGIN=https://app.yourdomain.com

# ── Email ─────────────────────────────────────────────────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

Generate secure random values:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

---

## Docker Compose (Production)

```yaml title="docker-compose.prod.yaml"
version: "3.9"

services:
  api:
    image: Secuird/Secuird-api:latest
    restart: always
    env_file: /etc/Secuird.env
    ports:
      - "127.0.0.1:5000:5000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: Secuird
      POSTGRES_USER: Secuird
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U Secuird"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

```bash
# First run — apply migrations
docker compose -f docker-compose.prod.yaml exec api flask db upgrade

# Start
docker compose -f docker-compose.prod.yaml up -d
```

---

## Nginx Configuration

```nginx title="/etc/nginx/sites-available/Secuird"
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name auth.yourdomain.com;
    return 301 https://$host$request_uri;
}

# API
server {
    listen 443 ssl http2;
    server_name auth.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/auth.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auth.yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;

    # Rate limiting at nginx level (belt + suspenders)
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req zone=api burst=50 nodelay;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

---

## Database Backups

```bash title="backup.sh"
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/Secuird

pg_dump \
  --host db.internal \
  --user Secuird \
  --dbname Secuird \
  --format custom \
  --file "${BACKUP_DIR}/Secuird_${TIMESTAMP}.dump"

# Keep last 30 days
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
```

Add to cron:

```cron
0 2 * * * /opt/Secuird/backup.sh >> /var/log/Secuird-backup.log 2>&1
```

---

## Horizontal Scaling

Secuird is stateless (sessions in PostgreSQL, ephemeral state in Redis), so you can run multiple API instances behind a load balancer.

```
                    ┌─────────────────┐
Internet ──────────▶│  Load Balancer  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  API Instance 1 │
                    │  API Instance 2 │
                    │  API Instance N │
                    └────────┬────────┘
                             │
               ┌─────────────┴──────────────┐
               ▼                            ▼
        PostgreSQL (Primary)           Redis Cluster
        PostgreSQL (Read Replica)
```

:::important Session affinity not required
Because sessions and OIDC state are stored in Redis, sticky sessions are **not** required. Any API instance can serve any request.
:::

---

## Monitoring

### Health endpoint

```http
GET /api/v1/health
```

Returns `200 OK` when the API, database, and Redis are healthy.

### Metrics to monitor

| Metric | Alert threshold |
|--------|----------------|
| Response time (P99) | > 2s |
| Error rate (5xx) | > 1% |
| Login failure rate | > 20/min (potential brute force) |
| PostgreSQL connections | > 80% of `max_connections` |
| Redis memory | > 75% |
| Disk space (PostgreSQL) | > 80% |

### Log-based alerts

Watch for:
- `TOTP verify failed` — repeated failures may indicate an attack
- `SSH cert signing failed` — may indicate CA key issues
- `MFA policy user suspended` — compliance violations
- Repeated `500` errors — application errors

---

## Upgrading

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies
pip install -r requirements/production.txt

# 3. Check for new migrations
flask db migrate --dry-run

# 4. Take a database backup
pg_dump Secuird > Secuird_pre_upgrade.dump

# 5. Apply migrations
flask db upgrade

# 6. Restart the service
systemctl restart Secuird
```

---

## Firewall Rules

| Port | Protocol | Direction | Purpose |
|------|----------|-----------|---------|
| 443 | TCP | Inbound | HTTPS (nginx → clients) |
| 80 | TCP | Inbound | HTTP redirect |
| 5000 | TCP | Internal only | API (nginx → gunicorn) |
| 5432 | TCP | Internal only | PostgreSQL |
| 6379 | TCP | Internal only | Redis |
