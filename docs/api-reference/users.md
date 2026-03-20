---
id: users
title: Users API
sidebar_position: 3
---

# Users API

Endpoints for managing the authenticated user's own profile and account settings.

All endpoints require authentication unless noted otherwise.

---

## Get Profile

<span className="api-badge api-badge--get">GET</span> `/api/v1/users/me`

Returns the full profile for the authenticated user.

**Response `200`:**

```json
{
  "data": {
    "id": "usr_...",
    "email": "user@example.com",
    "full_name": "Jane Smith",
    "email_verified": true,
    "status": "active",
    "totp_enabled": true,
    "webauthn_credentials_count": 2,
    "external_accounts": ["google"],
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-03-01T09:30:00Z"
  }
}
```

---

## Update Profile

<span className="api-badge api-badge--patch">PATCH</span> `/api/v1/users/me`

Update the current user's profile fields.

**Request:**

```json
{
  "full_name": "Jane A. Smith"   // optional; any subset of fields
}
```

**Response `200`:** Returns the updated user object (same shape as `GET /api/v1/users/me`).

**Errors:**
- `400 VALIDATION_ERROR` — Validation failed on a field.
- `409 CONFLICT` — New email already in use (if email update supported).

---

## Delete Account

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/users/me`

Permanently delete the authenticated user's account. This action is **irreversible**.

:::danger
Deleting your account also removes all sessions, MFA credentials, SSH certificates, and linked OAuth accounts. Organization memberships are removed; organizations you own must have ownership transferred first.
:::

**Request:**

```json
{
  "password": "CurrentPass123!"  // confirmation required
}
```

**Response `200`:**

```json
{ "message": "Account deleted" }
```

**Errors:**
- `400 CANNOT_DELETE_ORG_OWNER` — Must transfer org ownership first.
- `401` — Password confirmation failed.

---

## Change Password

<span className="api-badge api-badge--post">POST</span> `/api/v1/users/me/password`

Change the authenticated user's password. Does **not** invalidate existing sessions; see the security hardening guide if that behavior is desired.

**Request:**

```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!",
  "new_password_confirm": "NewPass456!"
}
```

**Response `200`:**

```json
{ "message": "Password updated" }
```

**Errors:**
- `400 VALIDATION_ERROR` — Passwords don't match or new password fails policy.
- `401` — Current password is wrong.

---

## List Organizations

<span className="api-badge api-badge--get">GET</span> `/api/v1/users/me/organizations`

List all organizations the current user belongs to.

**Response `200`:**

```json
{
  "data": {
    "organizations": [
      {
        "id": "org_...",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "role": "admin",
        "joined_at": "2026-02-01T00:00:00Z",
        "department": {
          "id": "dept_...",
          "name": "Engineering"
        }
      }
    ]
  }
}
```

---

## Get MFA Compliance

<span className="api-badge api-badge--get">GET</span> `/api/v1/users/me/mfa-compliance`

Returns a detailed breakdown of the user's MFA compliance status across all organizations.

**Response `200`:**

```json
{
  "data": {
    "overall_status": "compliant",
    "missing_methods": [],
    "orgs": [
      {
        "org_id": "org_...",
        "org_name": "Acme Corp",
        "policy_mode": "required",
        "status": "compliant",
        "deadline_at": null,
        "required_methods": ["totp"]
      }
    ]
  }
}
```

| `overall_status` | Description |
|---|---|
| `compliant` | All enrolled methods satisfy every org policy |
| `grace_period` | Within a grace period — full access still granted |
| `past_due` | Grace period expired — compliance-only session on next login |
| `suspended` | Account suspended due to policy non-compliance |
| `not_required` | No org enforces MFA for this user |
