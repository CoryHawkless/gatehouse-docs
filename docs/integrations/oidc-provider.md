---
id: oidc-provider
title: OIDC Provider
sidebar_position: 1
---

# OIDC Provider

Secuird is a fully standards-compliant **OpenID Connect (OIDC) identity provider**. Any application that supports OIDC can use Secuird for SSO — Grafana, Vault, GitLab, Nextcloud, oauth2-proxy, Portainer, and thousands more.

---

## How It Works

```
Your Application (OIDC Client)
        │
        │  1. Redirect user to Secuird /oidc/authorize
        ▼
Secuird (OIDC Provider / IdP)
        │  2. User logs in + MFA
        │  3. Secuird redirects back with ?code=...
        ▼
Your Application
        │  4. POST /oidc/token  (exchange code for tokens)
        ▼
Secuird
        │  5. Returns { access_token, id_token, refresh_token }
        ▼
Your Application — user is authenticated ✅
```

---

## OIDC Discovery

Secuird publishes a standard discovery document:

```
GET /.well-known/openid-configuration
```

```json
{
  "issuer": "https://auth.yourdomain.com",
  "authorization_endpoint": "https://auth.yourdomain.com/oidc/authorize",
  "token_endpoint": "https://auth.yourdomain.com/oidc/token",
  "userinfo_endpoint": "https://auth.yourdomain.com/oidc/userinfo",
  "jwks_uri": "https://auth.yourdomain.com/oidc/jwks",
  "registration_endpoint": "https://auth.yourdomain.com/oidc/register",
  "revocation_endpoint": "https://auth.yourdomain.com/oidc/revoke",
  "introspection_endpoint": "https://auth.yourdomain.com/oidc/introspect",
  "scopes_supported": ["openid", "profile", "email", "roles"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "subject_types_supported": ["public"],
  "code_challenge_methods_supported": ["S256", "plain"]
}
```

---

## Setting Up an OIDC Client

### Step 1 — Create an OIDC client

Go to **OIDC Clients** in the sidebar, click **New Client**, fill in the name and redirect URIs, and save.

![OIDC Clients page — register applications that use Secuird for SSO](/img/screenshots/oidc-clients.png)

Or via the API:

```http
POST /api/v1/organizations/{org_id}/clients
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Grafana",
  "redirect_uris": ["https://grafana.yourdomain.com/login/generic_oauth"]
}
```

Response:

```json
{
  "data": {
    "oidc_client": {
      "id": "...",
      "client_id": "gh_abc123...",
      "client_secret": "cs_xyz789...",   // only shown once!
      "name": "Grafana",
      "redirect_uris": ["..."]
    }
  }
}
```

:::warning Save the client_secret
The `client_secret` is only returned once at creation. Store it securely. If you lose it, you must rotate it.
:::

### Step 2 — Configure your application

Use the `client_id` and `client_secret` in your application's OIDC configuration.

---

## Authorization Flow (with PKCE)

PKCE (Proof Key for Code Exchange) is required for all new clients. It prevents authorization code interception attacks.

### Step 1: Generate code verifier and challenge

```javascript
// Generate a random code verifier
const codeVerifier = crypto.randomBytes(64).toString('base64url');

// Derive the code challenge (S256)
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');
```

### Step 2: Redirect to authorization endpoint

```
GET /oidc/authorize
  ?response_type=code
  &client_id=gh_abc123...
  &redirect_uri=https://app.example.com/callback
  &scope=openid+profile+email+roles
  &state=random_state_value
  &nonce=random_nonce_value
  &code_challenge=<base64url_sha256_of_verifier>
  &code_challenge_method=S256
```

Secuird will show the login page (or use an existing Secuird session). After authentication, it redirects back:

```
https://app.example.com/callback
  ?code=auth_code_here
  &state=random_state_value
```

### Step 3: Exchange code for tokens

```http
POST /oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=auth_code_here
&redirect_uri=https://app.example.com/callback
&client_id=gh_abc123...
&client_secret=cs_xyz789...
&code_verifier=<original_code_verifier>
```

Response:

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_...",
  "id_token": "eyJ...",
  "scope": "openid profile email roles"
}
```

---

## Token Refresh

```http
POST /oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=rt_...
&client_id=gh_abc123...
&client_secret=cs_xyz789...
```

:::info Token rotation
Refresh tokens are **rotated on every use**. The old refresh token is immediately invalidated. If a refresh token is used more than once, it indicates a replay attack — all tokens for that user+client are revoked.
:::

---

## UserInfo Endpoint

```http
GET /oidc/userinfo
Authorization: Bearer {access_token}
```

Response:

```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "email_verified": true,
  "name": "Jane Smith",
  "preferred_username": "jane.smith",
  "picture": "https://...",
  "roles": ["org_1:admin", "org_2:member"]
}
```

---

## ID Token Claims

The ID token is an RS256-signed JWT containing:

| Claim | Description |
|-------|-------------|
| `iss` | Issuer URL (`OIDC_ISSUER_URL`) |
| `sub` | User UUID |
| `aud` | Client ID |
| `exp` | Expiry timestamp |
| `iat` | Issued-at timestamp |
| `auth_time` | When the user authenticated |
| `nonce` | The nonce from the authorization request |
| `email` | User's email |
| `email_verified` | Whether email is verified |
| `name` | User's full name |
| `preferred_username` | Email (used as username) |
| `picture` | Avatar URL (if set) |
| `roles` | Array of `{org_id}:{role}` strings |

---

## Token Revocation

```http
POST /oidc/revoke
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

token=rt_...
&token_type_hint=refresh_token  # or access_token
```

---

## Token Introspection

Used by resource servers to validate tokens:

```http
POST /oidc/introspect
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

token=eyJ...
```

Response (active token):

```json
{
  "active": true,
  "sub": "user_uuid",
  "email": "user@example.com",
  "scope": "openid profile email",
  "client_id": "gh_abc123",
  "exp": 1743678000,
  "iat": 1743674400
}
```

---

## JWKS Endpoint

Public keys used to verify ID token signatures:

```http
GET /oidc/jwks
```

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "key_id",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

---

## Managing OIDC Clients

```http
GET    /api/v1/organizations/{org_id}/clients          # list clients
POST   /api/v1/organizations/{org_id}/clients          # create client
DELETE /api/v1/organizations/{org_id}/clients/{id}     # deactivate client
```

---

## Integration Examples

### Grafana

```ini title="grafana.ini"
[auth.generic_oauth]
enabled = true
name = Secuird
allow_sign_up = true
client_id = gh_abc123...
client_secret = cs_xyz789...
scopes = openid profile email roles
auth_url = https://auth.yourdomain.com/oidc/authorize
token_url = https://auth.yourdomain.com/oidc/token
api_url = https://auth.yourdomain.com/oidc/userinfo
use_pkce = true
```

### oauth2-proxy

```yaml title="oauth2-proxy.yaml"
provider: oidc
oidc-issuer-url: https://auth.yourdomain.com
client-id: gh_abc123...
client-secret: cs_xyz789...
scope: openid profile email roles
email-domain: "*"
```

### Vault

```hcl title="vault-oidc.hcl"
path "auth/oidc/config" {
  oidc_discovery_url = "https://auth.yourdomain.com"
  oidc_client_id     = "gh_abc123..."
  oidc_client_secret = "cs_xyz789..."
  default_role       = "default"
}
```
