---
id: configuration
title: Configuration Reference
sidebar_position: 3
---

# Configuration Reference

All configuration is done via **environment variables**. Copy `.env.example` to `.env` and set the values below.

---

## Core

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key` | Flask secret key. **Change in production.** |
| `FLASK_ENV` | `development` | `development` or `production` |
| `APP_URL` | `http://localhost:8080` | Public URL of the frontend app. Used in email verification links. |
| `LOG_LEVEL` | `INFO` | Python log level: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `LOG_TO_STDOUT` | `False` | Set `True` to emit logs to stdout (useful for containerized deployments) |

---

## Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/authy2` | PostgreSQL connection string |
| `SQLALCHEMY_ECHO` | `False` | Set `True` to log all SQL queries (verbose, dev only) |
| `SQLALCHEMY_LOG_LEVEL` | `WARNING` | SQLAlchemy log level |

---

## Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL for sessions and Flask-Session |
| `SESSION_TYPE` | `redis` | Session backend (`redis` or `filesystem`) |
| `RATELIMIT_STORAGE_URL` | `redis://localhost:6379/1` | Redis URL for rate limit counters (separate DB recommended) |

---

## Security & Encryption

| Variable | Default | Description |
|----------|---------|-------------|
| `ENCRYPTION_KEY` | `dev-encryption-key` | Fernet key for encrypting OAuth client secrets. **Change in production.** |
| `CA_ENCRYPTION_KEY` | `dev-ca-encryption-key` | Fernet key for encrypting SSH CA private keys at rest. **Change in production.** |
| `BCRYPT_LOG_ROUNDS` | `12` | bcrypt cost factor. Higher = slower hash = more brute-force resistance. |

:::danger Never use defaults in production
Generate strong random values:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```
:::

---

## Session & Cookies

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_COOKIE_SECURE` | `True` | Send cookies over HTTPS only |
| `SESSION_COOKIE_SAMESITE` | `None` | SameSite policy. `None` is needed for cross-origin WebAuthn. |
| `SESSION_COOKIE_DOMAIN` | (from `WEBAUTHN_RP_ID`) | Cookie domain for cross-subdomain sharing |
| `MAX_SESSION_DURATION` | `86400` | Default session duration in seconds (1 day) |

---

## CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173,...` | Comma-separated list of allowed CORS origins |
| `CORS_SUPPORTS_CREDENTIALS` | `True` | Allow cookies in cross-origin requests |

---

## OIDC Provider

| Variable | Default | Description |
|----------|---------|-------------|
| `OIDC_ISSUER_URL` | `http://localhost:5000` | The OIDC issuer URL. This appears in all tokens and the discovery document. Must be publicly accessible. |
| `OIDC_ACCESS_TOKEN_LIFETIME` | `3600` | Access token lifetime in seconds (1 hour) |
| `OIDC_REFRESH_TOKEN_LIFETIME` | `2592000` | Refresh token lifetime in seconds (30 days) |
| `OIDC_ID_TOKEN_LIFETIME` | `3600` | ID token lifetime in seconds (1 hour) |
| `OIDC_AUTHORIZATION_CODE_LIFETIME` | `600` | Authorization code lifetime in seconds (10 minutes) |

---

## WebAuthn / Passkeys

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBAUTHN_RP_ID` | `localhost` | Relying Party ID — must match your domain (e.g., `yourdomain.com`) |
| `WEBAUTHN_RP_NAME` | `Secuird` | Human-readable name shown in passkey prompts |
| `WEBAUTHN_ORIGIN` | `http://localhost:8080` | Expected origin from the browser (must match frontend URL exactly) |

:::info WebAuthn in production
`WEBAUTHN_RP_ID` must be the registrable domain of your origin. For `https://app.yourdomain.com`, set `WEBAUTHN_RP_ID=yourdomain.com` (or `app.yourdomain.com`).
:::

---

## SSH Certificate Authority

| Variable | Default | Description |
|----------|---------|-------------|
| `SSH_CA_PRIVATE_KEY` | — | Optional: PEM-encoded global CA private key (takes priority over file path) |
| `SSH_CA_KEY_PATH` | — | Optional: path to a CA key file (`etc/ssh_ca.conf` defines defaults) |

The SSH CA can also be configured per-organization through the API — this is the recommended approach.

---

## Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATELIMIT_ENABLED` | `True` | Enable/disable rate limiting globally |
| `RATELIMIT_DEFAULT` | `100/hour` | Default rate limit for all endpoints |
| `RATELIMIT_AUTH_REGISTER` | `10 per minute; 50 per hour` | Registration endpoint limits |
| `RATELIMIT_AUTH_LOGIN` | `20 per minute; 100 per hour` | Login endpoint limits |
| `RATELIMIT_AUTH_TOTP_VERIFY` | `20 per minute; 100 per hour` | TOTP verify limits |
| `RATELIMIT_AUTH_FORGOT_PASSWORD` | `5 per minute; 20 per hour` | Password reset request limits |
| `RATELIMIT_AUTH_RESET_PASSWORD` | `10 per minute; 30 per hour` | Password reset completion limits |

---

## Email / Notifications

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | — | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASSWORD` | — | SMTP password |
| `SMTP_FROM` | — | Sender email address |
| `SMTP_USE_TLS` | `True` | Enable TLS for SMTP |

Email is used for:
- Email verification after registration
- Password reset links
- MFA compliance deadline warnings

---

## Environment configurations

Secuird ships three environment configurations:

| Config class | `FLASK_ENV` | Key differences |
|---|---|---|
| `DevelopmentConfig` | `development` | Debug on, verbose logging, relaxed rate limits |
| `TestingConfig` | `testing` | In-memory SQLite, rate limiting disabled |
| `ProductionConfig` | `production` | Debug off, strict rate limits, HTTPS forced |

Set the active config with `FLASK_ENV` or the `config_name` argument to `create_app()`.
