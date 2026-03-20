---
id: key-concepts
title: Key Concepts
sidebar_position: 3
---

# Key Concepts

---

**Organization** — The top-level container. Holds your team, CAs, departments, and security policy. Multiple organizations on one instance are fully isolated.

**User CA** — The Certificate Authority that signs developer SSH certificates. Deploy its public key to servers once via `TrustedUserCAKeys`. Servers accept any certificate signed by it — they don't need to know individual users.

**Host CA** — Signs server host keys so developers trust them without TOFU prompts. Developers add its public key to `~/.ssh/known_hosts` once.

**Certificate** — A short-lived, signed SSH credential. It carries the user's public key, a list of principals, and an expiry. Used alongside the private key to authenticate. Expires automatically — nothing to revoke.

**Principal** — A named string (e.g., `prod-servers`, `engineers`) embedded in a certificate. On the server, `sshd` maps principals to local users via `AuthorizedPrincipalsFile`. A user can only log in as a local user whose principals file includes one of their cert's principals.

**Department** — A group within an organization. Assign principals and a certificate validity period to a department; members inherit both. The main tool for controlling who can access what.

**MFA Policy** — An org-level rule requiring TOTP or a passkey before certificates can be issued. Modes: `disabled`, `optional`, `require_totp`, `require_webauthn`, `require_totp_or_webauthn`. Supports a grace period and auto-suspension for non-compliance.

**Session** — Created on login; returned as a bearer token. Stored server-side in PostgreSQL so it can be revoked instantly. The CLI caches it at `~/.secuird/token_cache.json`.

**Audit Log** — An immutable record of every security-relevant action: logins, cert issuances, admin changes, suspensions. Stored in PostgreSQL. See the [full reference](/docs/core-concepts/audit-logs).
