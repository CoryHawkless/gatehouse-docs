---
id: creating-an-organization
title: Creating an Organization
sidebar_position: 3
---

# Creating an Organization

An organization is the container for everything — your team, CAs, departments, policies.

---

## Sign up and create one

Go to [secuird.tech](https://secuird.tech) and sign in with Google, GitHub, or Microsoft. First sign-in creates your account automatically.

![Secuird login screen — sign in with email or an OAuth provider](/img/screenshots/login.png)

You'll be asked to create an organization. Give it:

- A **name** (e.g. "Acme Corp")
- A **slug** (e.g. `acme-corp`) — used in URLs and API calls

You're now the owner.

---

## Generate your CAs

Do this before inviting anyone. Go to **CAs** and create both:

- **User CA** — its public key goes on every server you want your team to access
- **Host CA** — its public key goes in your developers' `~/.ssh/known_hosts`

Secuird stores the private keys encrypted. You only interact with the public keys from here.

![CAs page — create and manage User CA and Host CA](/img/screenshots/cas.png)

→ [Setting up CAs in detail](setting-up-cas)

---

## Create departments

Go to **Departments** and set up at least one. A department defines:

- **Principals** — the names embedded in certificates that `sshd` checks against (e.g. `engineers`, `prod-servers`)
- **Certificate validity** — how long certs last (e.g. 8h for prod, 24h for staging)

Think of departments as "who can access what, and for how long."

---

## Set an MFA policy (if you want)

Go to **Security** → **MFA Policy**. Options:

- **Disabled** — no MFA
- **TOTP** — authenticator app required
- **Passkey** — hardware key or biometric required
- **Any** — users pick

You can set a grace period. After it passes, anyone who hasn't enrolled gets suspended automatically.

---

## Invite people

Go to **Members** → **Invite**. Enter an email, pick a role (member or admin), assign a department, send.

They get an email, click the link, sign in, and they're in. They can add their SSH key and start requesting certs right away.

![Members page — view, invite, and manage organization members](/img/screenshots/members.png)

→ [Managing your team in detail](managing-your-team)
