---
id: zerotier
title: ZeroTier Connectivity
sidebar_position: 5
---

# ZeroTier Connectivity

Secuird integrates with ZeroTier to manage network access for your organization. Instead of manually authorizing devices in the ZeroTier dashboard, Secuird ties device authorization to user identity — devices are authorized and deauthorized automatically based on time-limited activation sessions, and a background reconciliation worker keeps everything in sync.

:::info ZeroTier Central vs. Self-Hosted
Secuird works with both **ZeroTier Central** (the hosted SaaS at my.zerotier.com) and **self-hosted ZeroTier controllers**. We've tested extensively with self-hosted controllers and the legacy ZeroTier Central API. There is a known issue with the newer ZeroTier Central upstream — use the legacy API endpoint if you run into connectivity problems.
:::

---

## How it works

ZeroTier itself only knows about **devices** (identified by a 10-character node ID). It has no concept of users. Secuird bridges that gap:

1. Users register their devices in Secuird by providing their ZeroTier node ID
2. Admins approve access to specific networks (or the network is set to open join)
3. When a user activates a session, Secuird calls the ZeroTier API to **authorize** the device on the network
4. The session has a time limit — when it expires, a background worker **deauthorizes** the device automatically
5. The reconciliation worker runs every 1–2 minutes to catch drift, expire sessions, and clean up

```
User registers device (node ID from `zerotier-cli info`)
        │
        ▼
Admin approves access (or user joins open network)
        │
        ▼
User clicks "Activate" → Secuird authorizes device in ZeroTier
        │
        ├── Device can now reach the ZeroTier network ✅
        │
        └── Session timer starts (default: 8 hours)
                │
                └── Timer expires → worker deauthorizes device ❌
                    (or user manually deactivates)
```

---

## Setting up ZeroTier for your organization

### Step 1 — Configure ZeroTier credentials

Go to **Organization → ZeroTier Config** in the dashboard.

![ZeroTier Config Page](/img/zerotier/zt-config-page.png)

You need three things:

| Field | Description |
|-------|-------------|
| **Mode** | `ZeroTier Central (SaaS)` or `Self-hosted Controller` |
| **API Token** | For Central: get it from my.zerotier.com → Account → API Tokens. For self-hosted: the contents of `/var/lib/zerotier-one/authtoken.secret` on the controller host |
| **Controller URL** | For Central: locked to `https://api.zerotier.com/api/v1`. For self-hosted: your controller's address, e.g. `http://10.0.0.5:9993` |

When you save, Secuird runs a connectivity test against your controller. If the token is wrong or the URL is unreachable, credentials are **not saved** — you'll see the error immediately.

```http
PUT /api/v1/organizations/{org_id}/zerotier-config
Authorization: Bearer {admin_token}

{
  "zt_api_token": "your-token-here",
  "zt_api_url": "http://10.0.0.5:9993",
  "zt_api_mode": "controller"
}
```

:::tip
The `environment` label on networks (Production, Staging, Development, Lab) is purely for your team's organization. It doesn't affect how Secuird or ZeroTier behave — it's just a tag to help you tell networks apart in the dashboard.
:::

### Step 2 — Import networks

Go to **Organization → ZeroTier Networks**.

![ZeroTier Networks Page](/img/zerotier/zt-networks-page.png)

Secuird pulls the list of networks from your ZeroTier controller and shows which ones are already managed. Click **Import** on a network to bring it under Secuird's management. When creating or importing a network, you configure:

| Setting | What it does |
|---------|-------------|
| **Name** | Human-friendly label for the network |
| **ZeroTier Network ID** | The 16-character network ID from ZeroTier |
| **Environment** | Label only (Production / Staging / Development / Lab) — no functional effect |
| **Request Mode** | `open` (anyone joins), `approval_required` (admin must approve), `invite_only` (admin assigns) |
| **Default activation lifetime** | How long a session lasts when a user activates (default: 480 minutes / 8 hours) |
| **Max activation lifetime** | Upper cap — users can't request more than this, even if they try |

:::note About timeouts
The default and max activation lifetimes control how long a device stays authorized after activation. Once the timer runs out, the background worker deauthorizes the device. The user can re-activate at any time — they don't need to re-request access. Think of it like a lease that expires, not a revocation.
:::

```http
POST /api/v1/organizations/{org_id}/networks
Authorization: Bearer {admin_token}

{
  "name": "Engineering VPN",
  "zerotier_network_id": "abcdef0123456789",
  "environment": "production",
  "request_mode": "approval_required",
  "default_activation_lifetime_minutes": 480,
  "max_activation_lifetime_minutes": 1440
}
```

---

## User workflow

### Registering a device

Every user needs to register their device's ZeroTier node ID. Get it by running:

```bash
zerotier-cli info
```

This prints something like `200 info a1b2c3d4e5 1.12.2 ONLINE`. The 10-character hex string (`a1b2c3d4e5`) is the node ID.

Go to **Devices** in the dashboard and register it:

![Devices Page](/img/zerotier/zt-devices-page.png)

```http
POST /api/v1/organizations/{org_id}/devices
Authorization: Bearer {token}

{
  "node_id": "a1b2c3d4e5",
  "nickname": "James's laptop"
}
```

The node ID must be exactly 10 hex characters. You can also add a hostname, asset tag, or serial number for inventory tracking.

### Requesting access to a network

How this works depends on the network's **request mode**:

- **Open** — the user can join directly. No approval needed.
- **Approval required** — the user submits a request with an optional justification. An admin approves or rejects it.
- **Invite only** — only admins can assign access. Users can't self-request.

```http
POST /api/v1/organizations/{org_id}/approvals
Authorization: Bearer {token}

{
  "portal_network_id": "network-uuid-here",
  "device_id": "device-uuid-here",
  "justification": "Need access to staging for backend debugging"
}
```

### Activating a session

Once approved, the user's device membership sits in `approved_inactive` state. The device is **not** authorized on ZeroTier yet — the user has to explicitly activate it.

![Access Page](/img/zerotier/zt-access-page.png)

Click **Activate** in the dashboard, or:

```http
POST /api/v1/organizations/{org_id}/memberships/{membership_id}/activate
Authorization: Bearer {token}

{
  "lifetime_minutes": 480
}
```

This does three things:
1. Creates an **activation session** with an expiry time
2. Sets the membership state to `active_authorized`
3. Calls the ZeroTier API to **authorize** the device on the network

The user can now reach the ZeroTier network. When they're done, they can deactivate manually:

```http
POST /api/v1/organizations/{org_id}/memberships/{membership_id}/deactivate
Authorization: Bearer {token}
```

Or activate all their approved memberships at once:

```http
POST /api/v1/organizations/{org_id}/memberships/activate-all
Authorization: Bearer {token}

{ "lifetime_minutes": 480 }
```

---

## Membership states

A device's network membership moves through these states:

| State | Meaning |
|-------|---------|
| `pending_device_registration` | Approval exists but device isn't registered yet |
| `pending_request` | User submitted an access request |
| `pending_manager_approval` | Waiting for admin to approve |
| `approved_inactive` | Approved but not activated — device is **not** authorized in ZeroTier |
| `joined_deauthorized` | Device has been seen by ZeroTier but is not authorized |
| `active_authorized` | Session is active — device **is** authorized in ZeroTier ✅ |
| `activation_expired` | Session expired — device was deauthorized by the worker |
| `suspended` | Admin suspended access |
| `revoked` | Admin revoked access |
| `rejected` | Access request was rejected |

---

## Admin controls

### Kill switch

Admins can instantly revoke all network access for a user. On the **ZeroTier Access** page, click the red **Kill Switch** button:

![Kill Switch Dialog](/img/zerotier/zt-kill-switch.png)

Select the target user, scope (organization-wide or global), and an optional reason. This ends all active sessions, deauthorizes all devices, and suspends all memberships for that user immediately.

```http
POST /api/v1/organizations/{org_id}/kill-switch
Authorization: Bearer {admin_token}

{
  "target_user_id": "user-uuid",
  "scope": "organization",
  "reason": "Compromised credentials"
}
```

### Direct assignment

Admins can bypass the request flow and directly assign network access to a user:

```http
POST /api/v1/organizations/{org_id}/approvals/assign
Authorization: Bearer {admin_token}

{
  "target_user_id": "user-uuid",
  "portal_network_id": "network-uuid",
  "justification": "Emergency access grant"
}
```

### View all memberships

```http
GET /api/v1/organizations/{org_id}/admin/memberships
Authorization: Bearer {admin_token}
```

Returns all memberships across all users and networks in the org, with full detail (device info, network, state, sessions).

---

## API endpoints at a glance

### ZeroTier config (admin)
```http
GET    /api/v1/organizations/{org_id}/zerotier-config          # view config
PUT    /api/v1/organizations/{org_id}/zerotier-config          # set/update config
DELETE /api/v1/organizations/{org_id}/zerotier-config          # remove config
```

### Networks (admin)
```http
GET    /api/v1/organizations/{org_id}/networks                 # list managed networks
POST   /api/v1/organizations/{org_id}/networks                 # import/create network
GET    /api/v1/organizations/{org_id}/networks/{id}            # get network details
PATCH  /api/v1/organizations/{org_id}/networks/{id}            # update network settings
DELETE /api/v1/organizations/{org_id}/networks/{id}            # remove network
GET    /api/v1/organizations/{org_id}/zerotier/available-networks  # list ZT networks not yet imported
```

### Devices (user)
```http
GET    /api/v1/organizations/{org_id}/devices                  # list my devices
POST   /api/v1/organizations/{org_id}/devices                  # register device
GET    /api/v1/organizations/{org_id}/devices/{id}             # get device
PATCH  /api/v1/organizations/{org_id}/devices/{id}             # update device
DELETE /api/v1/organizations/{org_id}/devices/{id}             # remove device
```

### Access requests
```http
POST   /api/v1/organizations/{org_id}/approvals                # request access
GET    /api/v1/organizations/{org_id}/approvals                # list my approvals
GET    /api/v1/organizations/{org_id}/approvals/pending         # pending requests (admin)
POST   /api/v1/organizations/{org_id}/approvals/{id}/approve   # approve (admin)
POST   /api/v1/organizations/{org_id}/approvals/{id}/reject    # reject (admin)
POST   /api/v1/organizations/{org_id}/approvals/{id}/revoke    # revoke (admin)
POST   /api/v1/organizations/{org_id}/approvals/assign         # direct assign (admin)
```

### Memberships & sessions
```http
GET    /api/v1/organizations/{org_id}/memberships              # list my memberships
POST   /api/v1/organizations/{org_id}/memberships/{id}/activate     # activate
POST   /api/v1/organizations/{org_id}/memberships/{id}/deactivate   # deactivate
POST   /api/v1/organizations/{org_id}/memberships/activate-all      # bulk activate
DELETE /api/v1/organizations/{org_id}/memberships/{id}              # remove membership
GET    /api/v1/organizations/{org_id}/sessions                 # list my active sessions
DELETE /api/v1/organizations/{org_id}/sessions/{id}            # end session
POST   /api/v1/organizations/{org_id}/kill-switch              # kill switch (admin)
```
