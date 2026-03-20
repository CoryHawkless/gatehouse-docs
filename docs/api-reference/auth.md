---
id: auth
title: Authentication API
sidebar_position: 2
---

# Authentication API

Full reference for authentication endpoints.

---

## Register

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/register`

Create a new user account. The first registered user on the instance will receive `is_first_user: true` in the response.

**Rate limit:** 10/minute, 50/hour

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "full_name": "Jane Smith"         // optional
}
```

**Response `201`:**

```json
{
  "data": {
    "user": {
      "id": "usr_...",
      "email": "user@example.com",
      "full_name": "Jane Smith",
      "email_verified": false,
      "status": "active",
      "created_at": "2026-03-03T10:00:00Z"
    },
    "token": "sess_...",
    "expires_at": "2026-03-04T10:00:00Z",
    "is_first_user": true,
    "pending_invites": []         // org invites matching this email
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — Password too weak, emails don't match, etc.
- `409 CONFLICT` — Email already exists.

---

## Login

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/login`

Authenticate with email and password.

**Rate limit:** 20/minute, 100/hour

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "remember_me": false             // optional; extends session to 30 days
}
```

**Response `200` (no MFA):**

```json
{
  "data": {
    "user": { ... },
    "token": "sess_...",
    "expires_at": "2026-03-04T10:00:00Z",
    "mfa_compliance": { ... }     // present if compliance policy applies
  }
}
```

**Response `200` (WebAuthn required):**

```json
{
  "data": {
    "requires_webauthn": true
  }
}
```

**Response `200` (TOTP required):**

```json
{
  "data": {
    "requires_totp": true
  }
}
```

**Response `200` (compliance-only session):**

```json
{
  "data": {
    "user": { ... },
    "token": "sess_...",
    "expires_at": "...",
    "requires_mfa_enrollment": true,
    "mfa_compliance": {
      "overall_status": "past_due",
      "missing_methods": ["totp", "webauthn"],
      "deadline_at": "2026-03-01T00:00:00Z",
      "orgs": [...]
    }
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — Missing fields.
- `401 AUTHENTICATION_ERROR` — Invalid credentials.
- `403 AUTHORIZATION_ERROR` — Account suspended.

---

## Logout

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/logout`

Revoke the current session token. **Requires authentication.**

**Response `200`:**

```json
{ "message": "Logged out successfully" }
```

---

## Get Current User

<span className="api-badge api-badge--get">GET</span> `/api/v1/auth/me`

Returns the authenticated user's profile. Alias for `GET /api/v1/users/me`. **Requires authentication.**

---

## List Sessions

<span className="api-badge api-badge--get">GET</span> `/api/v1/auth/sessions`

List all active sessions for the current user. **Requires authentication.**

**Response `200`:**

```json
{
  "data": {
    "sessions": [
      {
        "id": "sess_...",
        "ip_address": "203.0.113.42",
        "user_agent": "Mozilla/5.0 ...",
        "created_at": "2026-03-03T08:00:00Z",
        "expires_at": "2026-03-04T08:00:00Z",
        "is_current": true,
        "is_compliance_only": false
      }
    ]
  }
}
```

---

## Revoke Session

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/auth/sessions/:session_id`

Revoke a specific session (log out a device). **Requires authentication.**

**Response `200`:**

```json
{ "message": "Session revoked" }
```

---

## Forgot Password

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/forgot-password`

Send a password reset link to the user's email.

**Rate limit:** 5/minute, 20/hour

**Request:**

```json
{ "email": "user@example.com" }
```

**Response `200`:** Always returns success (doesn't reveal whether email exists).

---

## Reset Password

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/reset-password`

Complete the password reset with the token from the email.

**Rate limit:** 10/minute, 30/hour

**Request:**

```json
{
  "token": "reset_token_from_email",
  "new_password": "NewPass456!",
  "new_password_confirm": "NewPass456!"
}
```

**Errors:** `400` — Invalid/expired token, passwords don't match.

---

## Verify Email

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/verify-email`

Verify the user's email address using the token sent at registration.

**Request:**

```json
{ "token": "verify_token_from_email" }
```

---

## TOTP Enrollment

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/totp/enroll`

Begin TOTP enrollment. **Requires authentication.**

**Response `200`:**

```json
{
  "data": {
    "secret": "BASE32SECRET...",
    "qr_code_url": "otpauth://totp/...",
    "backup_codes": ["abc123", "def456", ...]
  }
}
```

---

## TOTP Confirm Enrollment

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/totp/verify-enrollment`

Confirm TOTP setup by verifying the first code. **Requires authentication.**

**Request:**

```json
{ "code": "123456" }
```

---

## TOTP Verify (Login)

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/totp/verify`

Verify a TOTP code during login (after `/auth/login` returns `requires_totp: true`).

**Rate limit:** 20/minute, 100/hour

**Request:**

```json
{ "code": "123456" }
```

**Response `200`:**

```json
{
  "data": {
    "user": { ... },
    "token": "sess_...",
    "expires_at": "..."
  }
}
```

---

## TOTP Disable

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/totp/disable`

Disable TOTP for the current user. **Requires authentication.**

**Request:**

```json
{ "code": "123456" }
```

---

## Regenerate Backup Codes

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/totp/backup-codes/regenerate`

Regenerate TOTP backup codes. Old codes are immediately invalidated. **Requires authentication.**

**Request:**

```json
{ "code": "123456" }
```

---

## WebAuthn — Begin Registration

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/webauthn/register/begin`

Start WebAuthn credential registration. Returns a challenge for `navigator.credentials.create()`. **Requires authentication.**

**Request:**

```json
{
  "device_name": "My YubiKey"    // optional label
}
```

**Response:** WebAuthn `PublicKeyCredentialCreationOptions`

---

## WebAuthn — Complete Registration

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/webauthn/register/complete`

Complete WebAuthn registration with the credential from the browser. **Requires authentication.**

**Request:**

```json
{
  "credential": { /* navigator.credentials.create() response */ }
}
```

---

## WebAuthn — Begin Login

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/webauthn/login/begin`

Get a challenge for `navigator.credentials.get()`. Called after `/auth/login` returns `requires_webauthn: true`.

**Response:** WebAuthn `PublicKeyCredentialRequestOptions`

---

## WebAuthn — Complete Login

<span className="api-badge api-badge--post">POST</span> `/api/v1/auth/webauthn/login/complete`

Complete WebAuthn authentication.

**Request:**

```json
{
  "credential": { /* navigator.credentials.get() response */ }
}
```

**Response `200`:**

```json
{
  "data": {
    "user": { ... },
    "token": "sess_...",
    "expires_at": "..."
  }
}
```

---

## WebAuthn — List Credentials

<span className="api-badge api-badge--get">GET</span> `/api/v1/auth/webauthn/credentials`

List all registered passkeys. **Requires authentication.**

---

## WebAuthn — Delete Credential

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/auth/webauthn/credentials/:credential_id`

Delete a registered passkey. **Requires authentication.**

---

## WebAuthn — Rename Credential

<span className="api-badge api-badge--patch">PATCH</span> `/api/v1/auth/webauthn/credentials/:credential_id`

Rename a passkey. **Requires authentication.**

**Request:**

```json
{ "name": "Work Laptop Touch ID" }
```
