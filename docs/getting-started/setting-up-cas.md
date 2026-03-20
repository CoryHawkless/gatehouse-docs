---
id: setting-up-cas
title: Setting Up CAs
sidebar_position: 4
---

# Setting Up CAs

You need two CAs before anyone on your team can get a certificate. Create both from the **CAs** page in your organization.

:::warning Create both before inviting anyone
No User CA means no certificates. Get this done first.
:::

![CAs page — create your User CA and Host CA, copy public keys for deployment](/img/screenshots/cas.png)

---

## User CA

This is the one that controls access. Servers trust this CA, and Secuird uses it to sign developer certificates.

1. Click **Create User CA**
2. Secuird generates the key pair and stores the private key encrypted
3. Copy the public key — you need to deploy it to every server

### Put it on your servers

On each server that should accept Secuird certs:

```bash
sudo tee /etc/ssh/secuird_user_ca.pub << 'EOF'
<paste your User CA public key here>
EOF
```

Edit `/etc/ssh/sshd_config`:

```bash title="/etc/ssh/sshd_config"
TrustedUserCAKeys /etc/ssh/secuird_user_ca.pub
AuthorizedPrincipalsFile /etc/ssh/auth_principals/%u
```

Create a principals file for each local user. This controls who can log in as that user:

```bash title="/etc/ssh/auth_principals/ubuntu"
engineers
devops
```

Anyone with a cert containing the `engineers` or `devops` principal can SSH in as `ubuntu`.

Restart sshd:

```bash
sudo systemctl restart sshd
```

---

## Host CA

This one solves the "are you sure you want to connect?" prompt. Every time a developer SSHs into a server they haven't seen before, SSH asks them to verify the fingerprint. Most people just type `yes` — which is exactly the wrong habit. The Host CA fixes this properly.

Instead of trusting fingerprints server by server, developers trust your CA once. Any server whose host key is signed by that CA gets a clean connection.

1. Click **Create Host CA**
2. Copy the public key — developers need it for their `known_hosts`

### Sign each server's host key

On the server, grab its host public key:

```bash
cat /etc/ssh/ssh_host_ed25519_key.pub
```

In Secuird, go to **CAs** → your Host CA → **Sign Host Key**. Paste the key, set the principals (usually the server's hostname), request the cert.

Install the cert on the server:

```bash
sudo tee /etc/ssh/ssh_host_ed25519_key-cert.pub << 'EOF'
<paste the certificate here>
EOF
sudo chmod 644 /etc/ssh/ssh_host_ed25519_key-cert.pub
```

Add to `/etc/ssh/sshd_config`:

```bash title="/etc/ssh/sshd_config"
HostCertificate /etc/ssh/ssh_host_ed25519_key-cert.pub
```

Restart sshd:

```bash
sudo systemctl restart sshd
```

### Developers: trust the Host CA once

Each developer adds the Host CA public key to their `~/.ssh/known_hosts`:

```bash title="~/.ssh/known_hosts"
@cert-authority *.example.com <paste Host CA public key here>
```

Replace `*.example.com` with a pattern matching your servers. After this, SSH connects to any signed server without prompts — no per-server fingerprint confirmation needed.

---

## Test it

Get a signed user cert (or have a team member do it), then:

```bash
ssh ubuntu@server.example.com
```

No `authorized_keys` entry. No host fingerprint prompt. If it connects, you're done.

→ [Managing your team](managing-your-team)
