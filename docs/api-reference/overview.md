---
id: overview
title: API Overview
sidebar_position: 1
---

# API Reference

The Secuird REST API provides complete programmatic access to all platform features.

---

## Base URL

```
https://api.secuird.tech
```

All endpoints under `/api/v1/` are versioned. OIDC endpoints are at the root level (`/oidc/`).

---

## Authentication

Most endpoints require authentication. Pass the session token as a `Bearer` token:

```http
Authorization: Bearer sess_a1b2c3d4e5f6...
```

Obtain a token via `POST /api/v1/auth/login` or `POST /api/v1/auth/register`.

For long-lived programmatic access you can generate an **API Key** from **Settings → API Keys** in the UI.

![API Keys page — create and manage long-lived API tokens for programmatic access](/img/screenshots/api-keys.png)

---

## Response Envelope

All responses follow a consistent envelope:

```json
{
  "version": "1.0",
  "success": true,
  "code": 200,
  "message": "Human-readable message",
  "data": {
    // Response payload
  }
}
```

Error responses:

```json
{
  "version": "1.0",
  "success": false,
  "code": 401,
  "message": "Invalid credentials",
  "error_type": "AUTHENTICATION_ERROR",
  "error_details": null
}
```

### Error types

| `error_type` | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed schema validation. `error_details` contains field errors. |
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing credentials |
| `AUTHORIZATION_ERROR` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource already exists (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `BAD_REQUEST` | 400 | Malformed request |
| `COMPLIANCE_REQUIRED` | 403 | Compliance-only session; MFA enrollment required |

---

## Rate Limiting

All endpoints are rate-limited. Limits are returned in response headers:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 17
X-RateLimit-Reset: 1743678000
```

When exceeded:

```json
{
  "success": false,
  "code": 429,
  "message": "Rate limit exceeded",
  "error_type": "RATE_LIMIT_EXCEEDED"
}
```

Default limits (configurable via environment variables):

| Endpoint | Limit |
|----------|-------|
| `POST /api/v1/auth/register` | 10/min, 50/hour |
| `POST /api/v1/auth/login` | 20/min, 100/hour |
| `POST /api/v1/auth/totp/verify` | 20/min, 100/hour |
| `POST /api/v1/auth/forgot-password` | 5/min, 20/hour |
| All other endpoints | 100/hour |

---

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes (POST/PATCH) | Must be `application/json` |
| `Authorization` | For auth'd endpoints | `Bearer {token}` |
| `X-Request-ID` | Optional | Custom request ID for tracing. Auto-generated if not provided. |

---

## Pagination

List endpoints support pagination via query parameters:

```
GET /api/v1/organizations/{org_id}/members?limit=50&offset=0
```

Response includes metadata:

```json
{
  "data": {
    "members": [...],
    "count": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains  (HTTPS only)
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
X-Request-ID: req_...
```

---

## API Endpoint Index

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/logout` | Logout (revoke current session) |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/auth/sessions` | List active sessions |
| DELETE | `/api/v1/auth/sessions/:id` | Revoke a session |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Complete password reset |
| POST | `/api/v1/auth/verify-email` | Verify email address |
| POST | `/api/v1/auth/totp/enroll` | Begin TOTP enrollment |
| POST | `/api/v1/auth/totp/verify-enrollment` | Complete TOTP enrollment |
| POST | `/api/v1/auth/totp/verify` | Verify TOTP code at login |
| POST | `/api/v1/auth/totp/disable` | Disable TOTP |
| POST | `/api/v1/auth/totp/backup-codes/regenerate` | Regenerate backup codes |
| POST | `/api/v1/auth/webauthn/register/begin` | Begin WebAuthn registration |
| POST | `/api/v1/auth/webauthn/register/complete` | Complete WebAuthn registration |
| POST | `/api/v1/auth/webauthn/login/begin` | Begin WebAuthn authentication |
| POST | `/api/v1/auth/webauthn/login/complete` | Complete WebAuthn authentication |
| GET | `/api/v1/auth/webauthn/credentials` | List passkeys |
| DELETE | `/api/v1/auth/webauthn/credentials/:id` | Delete a passkey |
| PATCH | `/api/v1/auth/webauthn/credentials/:id` | Rename a passkey |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get profile |
| PATCH | `/api/v1/users/me` | Update profile |
| DELETE | `/api/v1/users/me` | Delete account |
| POST | `/api/v1/users/me/password` | Change password |
| GET | `/api/v1/users/me/organizations` | Get organizations |
| GET | `/api/v1/users/me/mfa-compliance` | Get MFA compliance status |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/organizations` | Create organization |
| GET | `/api/v1/organizations/:id` | Get organization |
| PATCH | `/api/v1/organizations/:id` | Update organization |
| DELETE | `/api/v1/organizations/:id` | Delete organization |
| GET | `/api/v1/organizations/:id/members` | List members |
| DELETE | `/api/v1/organizations/:id/members/:user_id` | Remove member |
| PATCH | `/api/v1/organizations/:id/members/:user_id` | Update member role |
| POST | `/api/v1/organizations/:id/invitations` | Invite member |
| GET | `/api/v1/organizations/:id/invitations` | List invitations |
| DELETE | `/api/v1/organizations/:id/invitations/:id` | Revoke invitation |
| POST | `/api/v1/organizations/invitations/accept` | Accept invitation |
| POST | `/api/v1/organizations/:id/transfer-ownership` | Transfer ownership |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/organizations/:org_id/departments` | List departments |
| POST | `/api/v1/organizations/:org_id/departments` | Create department |
| GET | `/api/v1/organizations/:org_id/departments/:id` | Get department |
| PATCH | `/api/v1/organizations/:org_id/departments/:id` | Update department |
| DELETE | `/api/v1/organizations/:org_id/departments/:id` | Delete department |
| POST | `/api/v1/organizations/:org_id/departments/:id/members` | Add member |
| DELETE | `/api/v1/organizations/:org_id/departments/:id/members/:user_id` | Remove member |

### Principals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/organizations/:org_id/principals` | List principals |
| POST | `/api/v1/organizations/:org_id/principals` | Create principal |
| PATCH | `/api/v1/organizations/:org_id/principals/:id` | Update principal |
| DELETE | `/api/v1/organizations/:org_id/principals/:id` | Delete principal |
| POST | `/api/v1/organizations/:org_id/principals/:id/members` | Add user |
| DELETE | `/api/v1/organizations/:org_id/principals/:id/members/:user_id` | Remove user |
| POST | `/api/v1/organizations/:org_id/principals/:id/departments` | Link department |

### Security Policies (MFA)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/organizations/:org_id/security-policy` | Get policy |
| PUT | `/api/v1/organizations/:org_id/security-policy` | Update policy |
| GET | `/api/v1/organizations/:org_id/security-policy/users/:user_id` | Get user override |
| PUT | `/api/v1/organizations/:org_id/security-policy/users/:user_id` | Set user override |
| GET | `/api/v1/organizations/:org_id/security-policy/compliance` | List compliance |

### SSH
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ssh/keys` | List SSH public keys |
| POST | `/api/v1/ssh/keys` | Upload SSH public key |
| DELETE | `/api/v1/ssh/keys/:id` | Delete SSH key |
| GET | `/api/v1/ssh/certificates` | List certificates |
| POST | `/api/v1/ssh/certificates/request` | Request a signed certificate |
| GET | `/api/v1/organizations/:org_id/cas` | List CAs |
| POST | `/api/v1/organizations/:org_id/cas` | Create CA |
| GET | `/api/v1/organizations/:org_id/cas/:id` | Get CA |
| PATCH | `/api/v1/organizations/:org_id/cas/:id` | Update CA |
| DELETE | `/api/v1/organizations/:org_id/cas/:id` | Delete CA |
| POST | `/api/v1/organizations/:org_id/cas/:id/rotate-key` | Rotate CA key |

### OIDC (Provider endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/.well-known/openid-configuration` | Discovery document |
| GET | `/oidc/authorize` | Authorization endpoint |
| POST | `/oidc/token` | Token endpoint |
| GET | `/oidc/userinfo` | UserInfo endpoint |
| GET | `/oidc/jwks` | JSON Web Key Set |
| POST | `/oidc/revoke` | Token revocation |
| POST | `/oidc/introspect` | Token introspection |
| POST | `/oidc/register` | Dynamic client registration |
| GET | `/api/v1/organizations/:org_id/oidc/clients` | List OIDC clients |
| POST | `/api/v1/organizations/:org_id/oidc/clients` | Create OIDC client |
| PATCH | `/api/v1/organizations/:org_id/oidc/clients/:id` | Update OIDC client |
| DELETE | `/api/v1/organizations/:org_id/oidc/clients/:id` | Delete OIDC client |
| POST | `/api/v1/organizations/:org_id/oidc/clients/:id/rotate-secret` | Rotate client secret |
