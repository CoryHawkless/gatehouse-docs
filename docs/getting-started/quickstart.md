---
id: quickstart
title: Quick Start
sidebar_position: 1
---

# Running it yourself

Want to run Secuird on your own machine or server? This gets you from zero to a working instance.

If you're just joining an existing Secuird organization, you don't need any of this — [start here instead](/docs/getting-started).

---

## Prerequisites

Before you start, make sure you have:

- **Python 3.11+** (`python --version`)
- **PostgreSQL 14+** running locally (or a connection string to a remote instance)
- **Redis 6+** running locally (`redis-server`)
- **Git**

---

## 1. Clone the repository

```bash
git clone https://github.com/CoryHawkless/gatehouse-api.git
cd Secuird/Secuird-api
```

---

## 2. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

---

## 3. Install dependencies

```bash
pip install -r requirements/development.txt
```

---

## 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```bash title=".env"
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Secuird

# Redis
REDIS_URL=redis://localhost:6379/0

# Security — generate strong secrets for production!
SECRET_KEY=change-me-in-production
ENCRYPTION_KEY=change-me-in-production
CA_ENCRYPTION_KEY=change-me-in-production

# App URL (used in email verification links, OIDC issuer, etc.)
APP_URL=http://localhost:8080
OIDC_ISSUER_URL=http://localhost:5000

# Email (optional — set to enable email verification)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=you@gmail.com
# SMTP_PASSWORD=your-app-password
```

---

## 5. Create the database

```bash
# Create the database (if it doesn't exist)
createdb Secuird

# Run migrations
flask db upgrade
```

---

## 6. (Optional) Seed sample data

```bash
python scripts/seed_data.py
```

This creates a demo organization, admin user, and sample OIDC client.

---

## 7. Start the API

```bash
flask run
# or for production-like WSGI:
python wsgi.py
```

The API is now available at **http://localhost:5000**.

---

## 8. Verify it's working

```bash
# Check health
curl http://localhost:5000/api/v1/health

# Register your first user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123!","full_name":"Admin User"}'
```

Expected response:

```json
{
  "version": "1.0",
  "success": true,
  "code": 201,
  "message": "Registration successful",
  "data": {
    "user": { "id": "...", "email": "admin@example.com", ... },
    "token": "sess_...",
    "expires_at": "2026-04-03T10:00:00Z",
    "is_first_user": true
  }
}
```

:::tip First user
The `is_first_user: true` flag means you are the first registered user on this instance. The UI uses this to guide you through setting up your first organization.
:::

---

## 9. Create your first organization

```bash
export TOKEN="sess_..."  # token from the registration response

curl -X POST http://localhost:5000/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","slug":"acme"}'
```

---

## What's next?

- [Configuration Reference →](/docs/getting-started/configuration)
- [Enable OIDC SSO →](/docs/integrations/oidc-provider)
- [Set up SSH Certificate Authority →](/docs/integrations/ssh-ca)
- [Enforce MFA across your organization →](/docs/core-concepts/mfa-policies)
- [Deploy to production →](/docs/deployment/self-hosting)
