---
id: oauth-social
title: OAuth Social Login
sidebar_position: 2
---

# OAuth Social Login

Secuird supports signing in with **Google**, **GitHub**, and **Microsoft** via OAuth 2.0. Users can use their existing accounts instead of creating passwords.

---

## How It Works

```
User clicks "Sign in with Google"
        │
        ▼
GET /api/v1/auth/external/google/authorize?flow=login
        │
        ▼ (302 redirect)
Google OAuth Consent Page
        │
        ▼ (user approves)
GET /api/v1/auth/external/google/callback?code=...&state=...
        │
        ▼
Secuird validates code, fetches user profile from Google
        │
        ├── Account found by email → log in
        └── No account → create new account
        │
        ▼
{ token, user, expires_at }  ✅
```

---

## Supported Providers

| Provider | `provider` slug | OAuth App |
|----------|----------------|-----------|
| Google | `google` | [Google Cloud Console](https://console.cloud.google.com/) |
| GitHub | `github` | [GitHub Developer Settings](https://github.com/settings/applications/new) |
| Microsoft | `microsoft` | [Azure App Registrations](https://portal.azure.com/) |

---

## Configuring OAuth Providers

### Option A: System-level (global defaults)

Set environment variables for all organizations:

```bash title=".env"
# Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Microsoft
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id  # or "common" for multi-tenant
```

### Option B: Per-organization configuration

Organization admins can configure their own OAuth credentials, overriding system defaults:

```http
POST /api/v1/auth/external/providers/google/config
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "client_id": "your-org-specific-google-client-id",
  "client_secret": "your-org-specific-google-client-secret"
}
```

Update or replace:

```http
POST /api/v1/auth/external/providers/google/config
Authorization: Bearer {admin_token}

{
  "client_id": "new-client-id",
  "client_secret": "new-client-secret"
}
```

Delete:

```http
DELETE /api/v1/auth/external/providers/google/config
Authorization: Bearer {admin_token}
```

List configured providers:

```http
GET /api/v1/auth/external/providers
Authorization: Bearer {token}
```

---

## Redirect URIs

When setting up your OAuth app, configure the callback URL:

```
https://api.secuird.tech/api/v1/auth/external/{provider}/callback
```

For local development:

```
http://localhost:5000/api/v1/auth/external/google/callback
```

---

## Login Flow

### Initiating login

Redirect the user to:

```
GET /api/v1/auth/external/{provider}/authorize?flow=login
```

Optional parameters:

| Parameter | Description |
|-----------|-------------|
| `redirect_url` | Where to redirect after successful login (must be in allowed origins) |
| `oidc_session_id` | Internal: link this OAuth flow to an OIDC authorization session |

### Callback

After the user authorizes:

```
GET /api/v1/auth/external/{provider}/callback?code=...&state=...
```

Secuird:
1. Validates the `state` parameter (CSRF protection)
2. Exchanges the `code` for tokens from the provider
3. Fetches the user's profile from the provider
4. Finds or creates a Secuird account
5. Creates a session and returns the token

---

## Account Linking

Authenticated users can link additional OAuth providers to their Secuird account:

```
GET /api/v1/auth/external/{provider}/authorize?flow=link
Authorization: Bearer {token}   (in the redirect state, not header)
```

After the OAuth flow, the provider is linked to the user's account as an additional authentication method.

### Unlink a provider

```http
DELETE /api/v1/auth/external/{provider}/unlink
Authorization: Bearer {token}
```

:::warning Cannot unlink last method
If a user only has one authentication method (e.g., only Google), they cannot unlink it. They must first add a password or another provider.
:::

---

## Listing Linked Accounts

```http
GET /api/v1/auth/external/linked-accounts
Authorization: Bearer {token}
```

Response:

```json
{
  "data": {
    "linked_accounts": [
      {
        "provider": "google",
        "provider_user_id": "112233445566",
        "email": "user@gmail.com",
        "linked_at": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

## CLI OAuth Flow (`/token_please`)

Secuird supports a device-like OAuth flow for CLI tools via the `/token_please` endpoint:

```
GET /api/v1/token_please
  ?provider=google
  &redirect_url=http://localhost:3000/callback  # local CLI listener
```

The user authenticates in the browser; the CLI receives the token at the local redirect URL. This avoids storing credentials in CLI config files.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (type: Web application)
3. Add your Secuird callback URL to "Authorized redirect URIs"
4. Copy `Client ID` and `Client Secret`

Required scopes: `openid`, `email`, `profile`

---

## GitHub OAuth Setup

1. Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Set Homepage URL to your Secuird URL
3. Set Authorization callback URL to your Secuird callback URL
4. Copy `Client ID` and generate a `Client Secret`

Required scopes: `read:user`, `user:email`

---

## Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/) → App Registrations → New Registration
2. Set redirect URI to your Secuird callback URL (platform: Web)
3. Under Certificates & Secrets, create a new client secret
4. Note the Application (client) ID and Directory (tenant) ID

Required scopes: `openid`, `profile`, `email`

Set `MICROSOFT_TENANT_ID`:
- `common` — any Microsoft/Azure AD account
- `organizations` — only Azure AD organizational accounts
- `consumers` — only personal Microsoft accounts
- Specific tenant ID — only users in your Azure AD tenant
