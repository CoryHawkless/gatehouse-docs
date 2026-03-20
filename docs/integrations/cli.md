---
id: cli
title: Secuird CLI
sidebar_position: 1
---

# Secuird CLI

The `secuird` CLI is the main tool developers use to interact with Secuird. It handles everything on the user side: logging in, registering your SSH key, requesting certificates, and checking when a cert expires.

You don't need to touch the web UI for day-to-day use. Once your admin has set up the organization and added you to the right departments, the CLI is all you need.

![CLI Guide page — step-by-step instructions displayed right in the dashboard](/img/screenshots/cli-guide.png)

---

## Installation

The CLI is a single Python script with a few dependencies.

```bash
cd secuird-api/client
pip install requests python-jwt pytz coloredlogs python-dotenv sshkey-tools
```

### Configuration

Create a `.env` file in the same directory, or export the variable in your shell:

```bash
# URL of your Secuird API server
SIGN_URL=https://secuird.tech
```

| Variable | Default | Description |
|---|---|---|
| `SIGN_URL` | `http://localhost:5000` | Base URL of the Secuird API |
| `SSH_KEY_FILE` | — | Path to SSH public key (alternative to `-k` flag) |
| `CERT_ID` | — | UUID of a specific SSH key to use when signing (skips interactive picker) |

---

## Commands

```
Usage: secuird [options]

  -k FILE, --ssh-key FILE    Path to your SSH public key (use with -a)
  -a, --add-key              Register and verify your SSH public key
  -r, --request-cert         Request a signed SSH certificate
  -c, --check-cert           Check certificate validity (exit 0 = valid, exit 1 = invalid/missing)
  -f, --force                Force certificate renewal even if the current cert is still valid
      --list-keys            List all SSH keys registered to your profile
      --remove-key [KEY_ID]  Remove a key (interactive picker if KEY_ID omitted)
      --clear-cache          Remove the cached authentication token
```

---

## First time setup

### Step 1 — Register your SSH public key

```bash
secuird -a -k ~/.ssh/id_ed25519.pub
```

This will open your browser for login. Sign in with Google, GitHub, or Microsoft — whichever your organization uses. After login, the CLI uploads your public key and immediately runs a **challenge-response verification**: Secuird sends a random string, your CLI signs it with your private key, and the server verifies the signature. This confirms you actually own the key.

If the verification passes, your key status becomes **verified** and it can be used to request certificates. If it fails (e.g., wrong key path, key mismatch), the key is registered but stays unverified — re-run `secuird -a -k <path>` to retry verification.

> **Note:** If the certificate output path already has a `.cert` file, the CLI will ask before overwriting it.

### Step 2 — Request a certificate

```bash
secuird -r
```

Secuird looks at your organization memberships, finds your assigned principals, and signs your key with the User CA. The certificate is written to `~/.ssh/id_ed25519-cert.pub` (alongside your private key).

If you have multiple registered keys, the CLI will show a picker.

### Step 3 — SSH to a server

```bash
ssh user@your-server
```

OpenSSH automatically picks up the certificate if it's named to match your private key (e.g., `id_ed25519` and `id_ed25519-cert.pub`). You can also be explicit:

```bash
ssh -i ~/.ssh/id_ed25519 user@your-server
```

---

## Checking and renewing certificates

Check how much time is left on your current certificate:

```bash
secuird -c
```

This exits with code `0` if the cert is valid, `1` if it's expired or missing. Useful in scripts.

Request a new cert before the current one expires:

```bash
secuird -r -f
```

The `-f` (force) flag skips the "cert is still valid" check and issues a fresh one regardless.



Every command that talks to the API (everything except `--check-cert` and `--clear-cache`) triggers the **browser-based token acquisition flow**:

```
CLI                        Browser                     Secuird API / Frontend
 │                            │                                │
 │  1. Start local server     │                                │
 │     on 127.0.0.1:8250      │                                │
 │                            │                                │
 │  2. Open browser ──────────┼──► GET /api/v1/token_please   │
 │     ?redirect_url=         │        ?redirect_url=          │
 │     http://127.0.0.1:8250/ │        http://127.0.0.1:8250/  │
 │                            │                                │
 │                            │    ◄── 302 → /login?cli_token= │
 │                            │                                │
 │                            │  3. User logs in via OAuth     │
 │                            │     (Google / GitHub /         │
 │                            │      Microsoft)                │
 │                            │                                │
 │                            │  4. Frontend GETs              │
 │                            │     /api/v1/cli/redirect-url   │
 │                            │     ?token=<cli_token>         │
 │                            │                                │
 │                            │     ◄── { redirect_url }       │
 │                            │                                │
 │                            │  5. Frontend redirects to      │
 │                            │     http://127.0.0.1:8250/     │
 │                            │     ?token=<session_token>     │
 │                            │                                │
 │  6. Local server receives  │                                │
 │     token from browser ◄───┼────────────────────────────────│
 │                            │                                │
 │  7. Token saved to cache   │                                │
 │     ~/.secuird/            │                                │
 │     token_cache.json       │                                │
```

**Security note:** The `redirect_url` is validated server-side to only allow `localhost` or `127.0.0.1` — it cannot be redirected to an external host.

### Token caching

Once acquired, the session token is cached at:

```
~/.secuird/token_cache.json
```

On subsequent runs the CLI checks the cache first and skips the browser if the token is still valid. To manually clear it:

```bash
secuird --clear-cache
```

---

## Key management

### List keys

```bash
secuird --list-keys
```

Output:

```
  abc123...  ✓ verified   My Laptop   (added 2026-02-15)
  def456...  ✗ unverified My Desktop  (added 2026-03-01)
```

### Remove a key

Interactive (pick from list):

```bash
secuird --remove-key
```

By key ID directly:

```bash
secuird --remove-key abc123-full-uuid
```

---

## Certificate details

| Property | Value |
|---|---|
| **Cert file** | `~/.ssh/id_ed25519-cert.pub` (next to your private key) |
| **Type** | OpenSSH user certificate |
| **Principals** | Derived from your org memberships and department assignments |
| **Validity** | Set by the CA policy in your organization (configured per department) |
| **Algorithm** | Determined by the CA (ED25519 recommended) |

Principals are resolved from your org membership and department assignments. Org admins and owners receive all principals defined in the org; regular members receive only the principals assigned to their departments.

---

## Automation & scripting

For non-interactive environments (CI, cron jobs):

```bash
# Renew cert only if expired
secuird -c || secuird -r

# Force renew every time (e.g. in a pre-session hook)
secuird -r -f

# Skip key picker by specifying CERT_ID
CERT_ID=abc123-key-uuid secuird -r
```

:::info
In headless environments the browser-based auth flow won't work. Pre-cache the token on a machine with a browser, then copy `~/.secuird/token_cache.json` to the headless machine.
:::

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Browser doesn't open | No display / headless server | Pre-cache token on a machine with a browser, copy `~/.secuird/token_cache.json` |
| `No verified SSH keys found` | Key uploaded but not verified | Re-run `secuird -a -k <pubkey>` to re-trigger verification |
| `You have no principals assigned` | Not in any principal group | Ask your org admin to add you to a department or principal |
| `Certificate is not valid` | Cert expired or corrupt | Run `secuird -r` to get a fresh one |
| `Token expired` | Cached token stale | Run `secuird --clear-cache` then any command to re-authenticate |
| Port `8250` already in use | Another process using it | Kill the conflicting process; the port is hardcoded in the CLI |

