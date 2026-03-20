---
id: organizations
title: Organizations API
sidebar_position: 4
---

# Organizations API

Multi-tenant organization management, members, invitations, departments, and principals.

All endpoints require authentication unless noted otherwise.

---

## Create Organization

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations`

Create a new organization. The authenticated user becomes the **owner**.

**Request:**

```json
{
  "name": "Acme Corp",
  "slug": "acme-corp"       // optional; auto-generated from name if omitted
}
```

**Response `201`:**

```json
{
  "data": {
    "id": "org_...",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "owner_id": "usr_...",
    "created_at": "2026-03-01T00:00:00Z"
  }
}
```

**Errors:**
- `409 CONFLICT` — Slug already in use.

---

## Get Organization

<span className="api-badge api-badge--get">GET</span> `/api/v1/organizations/:org_id`

Get details for an organization. **Requires membership.**

**Response `200`:**

```json
{
  "data": {
    "id": "org_...",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "owner_id": "usr_...",
    "member_count": 42,
    "created_at": "..."
  }
}
```

---

## Update Organization

<span className="api-badge api-badge--patch">PATCH</span> `/api/v1/organizations/:org_id`

Update organization settings. **Requires admin or owner role.**

**Request:**

```json
{
  "name": "Acme Corporation"   // any subset of editable fields
}
```

---

## Delete Organization

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/organizations/:org_id`

Permanently delete an organization. **Requires owner role.**

:::danger
This removes all members, invitations, departments, principals, and SSH CA associations. This action is irreversible.
:::

---

## List Members

<span className="api-badge api-badge--get">GET</span> `/api/v1/organizations/:org_id/members`

List all members of an organization. **Requires membership.**

**Response `200`:**

```json
{
  "data": {
    "members": [
      {
        "user_id": "usr_...",
        "email": "user@example.com",
        "full_name": "Jane Smith",
        "role": "admin",
        "department": { "id": "dept_...", "name": "Engineering" },
        "joined_at": "2026-02-01T00:00:00Z"
      }
    ]
  }
}
```

---

## Update Member Role

<span className="api-badge api-badge--patch">PATCH</span> `/api/v1/organizations/:org_id/members/:user_id/role`

Change a member's role. **Requires admin or owner role.**

**Request:**

```json
{ "role": "admin" }    // owner | admin | member | guest
```

| Role | Description |
|---|---|
| `owner` | Full control; only one owner per org. Transfer via this endpoint. |
| `admin` | Manage members, settings, CA, policies. Cannot delete org. |
| `member` | Standard access; can generate SSH certs. |
| `guest` | Read-only; cannot generate certs. |

**Errors:**
- `400` — Cannot demote the last owner.

---

## Remove Member

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/organizations/:org_id/members/:user_id`

Remove a user from the organization. **Requires admin or owner role.**

---

## Invite User

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations/:org_id/invites`

Send an invitation to join the organization. **Requires admin or owner role.**

**Request:**

```json
{
  "email": "newuser@example.com",
  "role": "member"
}
```

**Response `201`:**

```json
{
  "data": {
    "id": "inv_...",
    "email": "newuser@example.com",
    "role": "member",
    "expires_at": "2026-03-10T00:00:00Z",
    "created_at": "2026-03-03T00:00:00Z"
  }
}
```

---

## List Invitations

<span className="api-badge api-badge--get">GET</span> `/api/v1/organizations/:org_id/invites`

List pending invitations. **Requires admin or owner role.**

---

## Accept Invitation

<span className="api-badge api-badge--post">POST</span> `/api/v1/invites/:token/accept`

Accept an organization invitation. Invitation token is delivered via email or from the invite URL.

**Requires authentication.** The authenticated user's email must match the invitation.

---

## Revoke Invitation

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/organizations/:org_id/invites/:invite_id`

Cancel a pending invitation. **Requires admin or owner role.**

---

## Departments

### List Departments

<span className="api-badge api-badge--get">GET</span> `/api/v1/organizations/:org_id/departments`

**Requires membership.**

### Create Department

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations/:org_id/departments`

**Requires admin or owner role.**

```json
{ "name": "Engineering" }
```

### Update Department

<span className="api-badge api-badge--patch">PATCH</span> `/api/v1/organizations/:org_id/departments/:dept_id`

### Delete Department

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/organizations/:org_id/departments/:dept_id`

### Assign Member to Department

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations/:org_id/departments/:dept_id/members`

```json
{ "user_id": "usr_..." }
```

### Remove Member from Department

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/organizations/:org_id/departments/:dept_id/members/:user_id`

---

## Principals

Principals are named groups that map to `AuthorizedPrincipals` in SSH certificates. Members assigned to a principal will have it included in their generated certs.

### List Principals

<span className="api-badge api-badge--get">GET</span> `/api/v1/organizations/:org_id/principals`

### Create Principal

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations/:org_id/principals`

```json
{
  "name": "developers",
  "description": "Can SSH to dev servers"
}
```

### Update Principal

<span className="api-badge api-badge--patch">PATCH</span> `/api/v1/organizations/:org_id/principals/:principal_id`

### Delete Principal

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/organizations/:org_id/principals/:principal_id`

### Add Member to Principal

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations/:org_id/principals/:principal_id/members`

```json
{ "user_id": "usr_..." }
```

### Remove Member from Principal

<span className="api-badge api-badge--delete">DELETE</span> `/api/v1/organizations/:org_id/principals/:principal_id/members/:user_id`

### Link Department to Principal

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations/:org_id/principals/:principal_id/departments`

All members of the department will inherit the principal.

```json
{ "department_id": "dept_..." }
```

---

## Security Policy

### Get Policy

<span className="api-badge api-badge--get">GET</span> `/api/v1/organizations/:org_id/policy`

**Requires membership.**

**Response `200`:**

```json
{
  "data": {
    "mode": "required",
    "grace_period_days": 7,
    "required_methods": ["totp"],
    "allow_override": false,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### Update Policy

<span className="api-badge api-badge--patch">PATCH</span> `/api/v1/organizations/:org_id/policy`

**Requires admin or owner role.**

```json
{
  "mode": "required",            // disabled | optional | required | enforced
  "grace_period_days": 7,
  "required_methods": ["totp"],
  "allow_override": false
}
```

| `mode` | Description |
|---|---|
| `disabled` | No MFA policy enforced |
| `optional` | MFA is encouraged but not required |
| `required` | MFA required; grace period applies to new members |
| `enforced` | MFA required; no grace period; non-compliant users suspended |

### Get Compliance Overview

<span className="api-badge api-badge--get">GET</span> `/api/v1/organizations/:org_id/policy/compliance`

Returns MFA compliance status for all members. **Requires admin or owner role.**

**Response `200`:**

```json
{
  "data": {
    "compliant_count": 38,
    "non_compliant_count": 4,
    "members": [
      {
        "user_id": "usr_...",
        "email": "user@example.com",
        "status": "past_due",
        "deadline_at": "2026-03-01T00:00:00Z",
        "enrolled_methods": []
      }
    ]
  }
}
```

### Override Member Compliance

<span className="api-badge api-badge--post">POST</span> `/api/v1/organizations/:org_id/policy/overrides`

Grant or revoke a per-user compliance override. **Requires admin or owner role.**

```json
{
  "user_id": "usr_...",
  "exempt": true,
  "reason": "Service account"
}
```
