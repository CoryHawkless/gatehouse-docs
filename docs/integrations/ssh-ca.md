---
id: ssh-ca
title: SSH Certificate Authority
sidebar_position: 3
---

# SSH Certificate Authority

Managing SSH access the traditional way — copying public keys into `~/.ssh/authorized_keys` on every server — works until it doesn't. Onboarding a new team member means touching every server. Someone leaves and you have to hunt down and remove their key everywhere. A key gets compromised and you're doing that same hunt under pressure.

Secuird replaces that with a Certificate Authority model. Your servers trust one CA public key, not individual users. Secuird signs short-lived certificates for users, and those certificates carry the permissions (principals) that determine what the user can access. When someone leaves, you remove them from the org — their cert expires on its own, and no new ones can be issued. Nothing to clean up on the servers themselves.

## Architecture

```
Organization Admin
        │  creates CA
        ▼
  CA (ED25519/RSA/ECDSA)
  stored encrypted in DB
        │
        ├── Public key → deployed to servers as TrustedUserCAKeys
        │
        └── Private key → used by Secuird to sign certificates

User
  1. Uploads SSH public key → POST /api/v1/ssh/keys
  2. Requests certificate  → POST /api/v1/ssh/certificates/request
  3. Gets signed cert      ← { certificate, serial, valid_until }
  4. Uses cert to SSH      → ssh -i cert user@server
```

---

## Setting Up a Certificate Authority

### Step 1 — Create a CA for your organization

```http
POST /api/v1/organizations/{org_id}/cas
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Production User CA",
  "description": "Signs user certificates for production servers",
  "ca_type": "user",         // "user" or "host"
  "key_type": "ed25519",     // "ed25519" (recommended), "rsa", "ecdsa"
  "default_cert_validity_hours": 8,
  "max_cert_validity_hours": 24
}
```

Response includes `public_key` — the CA's public key you'll deploy to servers.

### Step 2 — Deploy the CA public key to your servers

On each server that should trust this CA:

```bash title="/etc/ssh/sshd_config"
# Trust the Secuird CA for user certificates
TrustedUserCAKeys /etc/ssh/Secuird_ca.pub

# Require certificates (optional but recommended)
AuthorizedKeysFile none
```

Copy the CA public key to the server:

```bash
echo "ssh-ed25519 AAAA..." > /etc/ssh/Secuird_ca.pub
chmod 644 /etc/ssh/Secuird_ca.pub
systemctl reload sshd
```

---

## Generating SSH Certificates

### Step 1 — Upload your SSH public key

```http
POST /api/v1/ssh/keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Laptop",
  "public_key": "ssh-ed25519 AAAA... user@laptop"
}
```

### Step 2 — Request a certificate

```http
POST /api/v1/ssh/certificates/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "key_id": "sshkey_...",
  "principals": ["prod-servers", "bastion"],
  "expiry_hours": 8,
  "cert_type": "user"
}
```

Response:

```json
{
  "data": {
    "certificate": "ssh-ed25519-cert-v01@openssh.com AAAA...",
    "serial": "12345",
    "valid_after": "2026-03-03T10:00:00Z",
    "valid_before": "2026-03-03T18:00:00Z",
    "principals": ["prod-servers", "bastion"]
  }
}
```

### Step 3 — Use the certificate

Save the certificate to a file and use it:

```bash
# Save certificate
echo "ssh-ed25519-cert-v01@openssh.com AAAA..." > ~/.ssh/id_ed25519-cert.pub

# SSH with certificate (OpenSSH automatically uses matching cert)
ssh user@prod-server

# Or explicitly specify
ssh -i ~/.ssh/id_ed25519 -i ~/.ssh/id_ed25519-cert.pub user@prod-server
```

---

## Principals

Principals are the access groups embedded in certificates. The server's `sshd` uses them to determine who can log in as which user.

### Server configuration with principals

```bash title="/etc/ssh/sshd_config"
TrustedUserCAKeys /etc/ssh/Secuird_ca.pub
AuthorizedPrincipalsFile /etc/ssh/auth_principals/%u
```

```bash title="/etc/ssh/auth_principals/root"
prod-servers
```

```bash title="/etc/ssh/auth_principals/ubuntu"
prod-servers
bastion
```

Now only users whose Secuird certificate includes `prod-servers` in its principals can `ssh root@server` or `ssh ubuntu@server`.

### Managing principals

```http
# Create a principal
POST /api/v1/organizations/{org_id}/principals
{ "name": "prod-servers", "description": "Production server access" }

# Add a user to the principal
POST /api/v1/organizations/{org_id}/principals/{principal_id}/members
{ "email": "engineer@example.com" }

# Link an entire department to the principal
POST /api/v1/organizations/{org_id}/principals/{principal_id}/departments
{ "department_id": "dept_..." }
```

---

## Host Certificates

Host certificates prove the server's identity, eliminating the "Are you sure you want to continue connecting?" prompt.

### Create a Host CA

```http
POST /api/v1/organizations/{org_id}/cas
{
  "name": "Production Host CA",
  "ca_type": "host",
  "key_type": "ed25519"
}
```

### Request a host certificate

```http
POST /api/v1/ssh/certificates/request
Authorization: Bearer {admin_token}

{
  "key_id": "sshkey_...",          // the server's host public key
  "principals": ["prod-server-01.internal", "prod-server-01"],
  "cert_type": "host",
  "expiry_hours": 8760             // 1 year for host certs
}
```

### Client trust (on developer machines)

```bash title="~/.ssh/known_hosts"
@cert-authority *.internal ssh-ed25519 AAAA...  # the host CA public key
```

Now SSH clients auto-trust any server presenting a certificate signed by this CA.

---

## CA Management

```http
GET    /api/v1/organizations/{org_id}/cas              # list CAs
GET    /api/v1/organizations/{org_id}/cas/{ca_id}      # get CA details
PATCH  /api/v1/organizations/{org_id}/cas/{ca_id}      # update CA settings
DELETE /api/v1/organizations/{org_id}/cas/{ca_id}      # delete CA

# Get CA public key (for deployment to servers)
GET    /api/v1/organizations/{org_id}/cas/{ca_id}/public-key

# Generate a new CA key pair (rotation)
POST   /api/v1/organizations/{org_id}/cas/{ca_id}/rotate-key
```

---

## Certificate Policies

Control who can request certificates and with what parameters:

```http
POST /api/v1/organizations/{org_id}/departments/{dept_id}/cert-policy
Authorization: Bearer {admin_token}

{
  "max_validity_hours": 8,
  "allowed_principals": ["prod-servers", "staging-servers"],
  "require_principal_membership": true
}
```

---

## Viewing Certificates

```http
# My certificates
GET /api/v1/ssh/certificates
Authorization: Bearer {token}

# All certs in an org (admin only)
GET /api/v1/organizations/{org_id}/certificates
Authorization: Bearer {admin_token}
```

---

## Security Best Practices

- **Short validity**: Use 1–8 hours for user certificates. Short-lived certs don't need a CRL.
- **Least-privilege principals**: Don't give users more principals than they need.
- **Separate user and host CAs**: Never use the same key to sign both user and host certs.
- **Encrypt CA private keys**: Secuird encrypts CA private keys with `CA_ENCRYPTION_KEY` before storing in the database.
- **Back up CA keys**: Export and back up CA private keys securely. If lost, all previously signed certs can no longer be verified as traceable to your CA.
- **Key rotation**: Rotate CA keys periodically. Update `TrustedUserCAKeys` on all servers, then re-sign any long-lived certificates.
