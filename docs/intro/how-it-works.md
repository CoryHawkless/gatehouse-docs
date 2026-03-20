---
id: how-it-works
title: How It Works
sidebar_position: 4
---

# How It Works

---

## Admin flow {#admin-flow}

> **Tool:** secuird-ui (web)

**1. Register and create an organization**

The first account on the instance becomes the owner. From the UI, create an organization — this is the container for your team, CAs, and policies.

**2. Generate both CAs**

Do this before inviting anyone. Go to the organization's CA settings and generate:
- A **User CA** — its public key goes on every server that should accept your team's certificates
- A **Host CA** — its public key goes in developers' `~/.ssh/known_hosts`

Secuird stores both private keys encrypted. You won't see them again after creation, so treat the public keys as the deployment artifact.

**3. Configure servers**

On each server that should accept Secuird-signed certificates:

```bash title="/etc/ssh/sshd_config"
TrustedUserCAKeys /etc/ssh/secuird_user_ca.pub
AuthorizedPrincipalsFile /etc/ssh/auth_principals/%u
```

Create a principals file per local user listing which principals can log in as them:

```bash title="/etc/ssh/auth_principals/ubuntu"
engineers
prod-servers
```

**4. Invite the team**

Send invitations from the UI. Users receive a link, sign in with OAuth, and join the organization.

**5. Create departments and assign principals**

Departments group your team and define what they can access. Assign principals per department — these are the named strings embedded in certificates that `sshd` checks. Also set the certificate validity period per department (e.g., 8 hours for prod, 24 hours for staging).

**6. Set MFA policy (optional)**

Set a policy mode (TOTP, passkey, or either), optionally with a grace period. Secuird tracks enrollment and automatically suspends users who miss the deadline.

**7. Manage access**

To revoke access: suspend or remove the user. Their current cert expires naturally; no new ones can be issued.

---

## User flow {#user-flow}

> **Tool:** secuird-ui (web)

**1. Accept the invitation**

Click the link in the invite email. Sign in with your Google, GitHub, or Microsoft account.

**2. Enroll MFA (if required)**

If the organization has an MFA policy, you'll be prompted to set up TOTP (authenticator app) or a passkey before you can do anything else.

**3. Register your SSH public key**

In the UI, add your SSH public key. Secuird will run a challenge-response to verify you own the corresponding private key — it sends a string, you sign it, Secuird checks the signature. Only verified keys can be used to request certificates.

After this you're ready. Day-to-day certificate requests are handled from the CLI.

---

## Developer flow {#developer-flow}

> **Tool:** secuird CLI

**First time — add your key**

```bash
secuird -a -k ~/.ssh/id_ed25519.pub
```

A browser opens for OAuth login. After that, the CLI uploads your key and runs the challenge-response verification automatically.

**Request a certificate**

```bash
secuird -r
```

Secuird signs your key with the User CA and writes the certificate to `~/.ssh/id_ed25519-cert.pub`. OpenSSH picks it up automatically on the next SSH connection.

```bash
ssh user@your-server
```

**Check and renew**

```bash
secuird -c        # check validity (exit 0 = valid)
secuird -r        # request a new cert (when expired)
secuird -r -f     # force-renew before expiry
```

The session token is cached at `~/.secuird/token_cache.json` after the first login. Subsequent commands use it silently until it expires.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client Applications                       │
│         (Web UI · CLI · Mobile · Any OIDC-compatible app)       │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTPS
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    Secuird API  (:5000)                         │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Middleware  │  │  Blueprints  │  │  Error Handlers      │  │
│  │ • Request ID │  │ • /api/v1/*  │  │ • BaseAPIException   │  │
│  │ • Sec Headers│  │ • /oidc/*    │  │ • 404 / 405 / 500    │  │
│  │ • CORS       │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Service Layer                       │  │
│  │  AuthService · OIDCService · SSHCASigningService         │  │
│  │  UserService · OrganizationService · MfaPolicyService    │  │
│  │  WebAuthnService · TOTPService · AuditService            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                       Model Layer                        │  │
│  │  User · Organization · Session · OIDCClient              │  │
│  │  CA · SSHCertificate · AuditLog · SecurityPolicy         │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
      PostgreSQL DB               Redis Cache
   (persistent data)        (sessions · challenges
                             · rate limits · OIDC state)
```
