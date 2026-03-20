---
id: joining-an-organization
title: Joining an Organization
sidebar_position: 2
---

# Joining an Organization

Somebody invited you. Here's what happens.

---

## Sign in

Click the link in the invite email. It takes you to [secuird.tech](https://secuird.tech). Sign in with Google, GitHub, or Microsoft — use whichever account matches the email you were invited with.

:::tip Don't have the invite email?
You can also just go to [secuird.tech](https://secuird.tech), sign up, and you'll land in the same place as long as you use the email address you were invited with.
:::

If you don't have a Secuird account yet, one gets created on first sign-in. Nothing extra to do.

![Secuird login page showing email/password form and OAuth provider buttons](/img/screenshots/login.png)

---

## MFA setup

If the org requires MFA, you'll be asked to set it up right away — before you can do anything else.

- **TOTP** — scan a QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.)
- **Passkey** — register a hardware key or biometric (YubiKey, Touch ID, Windows Hello)

Some orgs give you a grace period. If so, you'll see a banner with the deadline.

---

## Add your SSH key

Go to **SSH Keys** in the sidebar, click **Add SSH Key**, and paste your public key. That's usually `~/.ssh/id_ed25519.pub` or `~/.ssh/id_rsa.pub`. Give it a name so you can tell your keys apart later.

![SSH Keys page — add and manage your public keys](/img/screenshots/ssh-keys.png)

Don't have one? Generate it:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Then paste the contents of `~/.ssh/id_ed25519.pub`.

---

## Request a certificate

Once your admin has the CA set up and you're assigned to a department:

1. Go to **Certificates**
2. Click **Request Certificate**
3. Download the cert and drop it next to your private key — e.g. `~/.ssh/id_ed25519-cert.pub`

SSH picks it up automatically if the naming matches (`id_ed25519` → `id_ed25519-cert.pub`).

---

## Connect

```bash
ssh user@server.example.com
```

That's it. The cert handles authentication. No `authorized_keys`, no host fingerprint prompts (if your team uses the Host CA too).

→ [More on keys and certificates](ssh-keys-and-certificates)
