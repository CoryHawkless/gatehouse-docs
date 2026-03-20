---
id: ssh-keys-and-certificates
title: SSH Keys & Certificates
sidebar_position: 6
---

# SSH Keys & Certificates

The day-to-day: add your key, get a cert, SSH in.

---

## Add your SSH key

Go to **SSH Keys**, click **Add SSH Key**, paste your public key. Supported types: `ssh-ed25519` (recommended), `ssh-rsa` (2048-bit+), `ecdsa`.

You can add multiple keys — one per device, one per machine, whatever. Name them so you can tell them apart.

![SSH Keys page — add public keys and manage all registered devices](/img/screenshots/ssh-keys.png)

If you don't have a key:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Your public key is at `~/.ssh/id_ed25519.pub`.

---

## Get a certificate

Go to **Certificates**, click **Request Certificate**. Secuird signs your public key with the org's User CA. The cert includes:

- Your principals (from your department)
- A validity period (also from your department)
- Your identity

Download it and drop it next to your private key:

```bash
mv ~/Downloads/id_ed25519-cert.pub ~/.ssh/id_ed25519-cert.pub
```

SSH picks it up automatically — the naming convention is `<key>-cert.pub`.

---

## SSH in

```bash
ssh ubuntu@server.example.com
```

The server checks three things: is the cert signed by the trusted CA, is it still valid, does it carry an allowed principal. If yes to all three, you're in.

---

## When it expires

Certs are short-lived on purpose. When yours runs out, go back to **Certificates** and request a new one. Replace the old file.

How long they last depends on your department. Typical:

- Production: 4–8 hours
- Staging: 12–24 hours
- Dev: 24 hours

---

## Using the CLI instead

If you'd rather not use the web UI every time:

```bash
secuird login              # authenticate (opens browser)
secuird cert request       # get a cert (saved automatically)
secuird cert info          # check what you've got
```

→ [CLI docs](/docs/integrations/cli)

---

## Common problems

**"Permission denied (publickey)"**
- Cert probably expired. Request a new one.
- Check the file is in the right place: `id_ed25519` needs `id_ed25519-cert.pub` next to it.
- Server might not trust the User CA. Ask your admin to check `sshd_config`.

**"Host key verification failed"**
- You don't have the Host CA in your `known_hosts`, or the server's host key isn't signed.
- Get the Host CA public key from your admin:
  ```bash
  echo '@cert-authority *.example.com <Host CA public key>' >> ~/.ssh/known_hosts
  ```
