---
id: getting-started
title: Getting Started
sidebar_label: Overview
sidebar_position: 1
---

# Getting Started

Secuird runs at [secuird.tech](https://secuird.tech). You don't need to install anything — go there, sign in, and you're in.

---

## Got an invite?

Someone already set things up for you. Check your email, click the link, sign in with Google/GitHub/Microsoft, and you're in the org.

→ [Joining an Organization](joining-an-organization)

---

## Starting fresh?

You want to create your own organization — set up CAs, invite people, manage SSH access for your team.

1. Sign up at [secuird.tech](https://secuird.tech)
2. Create an organization
3. Generate a User CA and a Host CA
4. Deploy the User CA public key to your servers
5. Invite your team — they sign in with OAuth and land in the org
6. They add their SSH key, request a cert, and connect

![Organization overview — your dashboard for members, CAs, and certificates](/img/screenshots/org-overview.png)

→ [Creating an Organization](creating-an-organization)

---

## Already in? Here's what's next

- [Setting Up CAs](setting-up-cas) — create both CAs and configure your servers
- [Managing Your Team](managing-your-team) — invite people, set up departments, handle MFA
- [SSH Keys & Certificates](ssh-keys-and-certificates) — add your key, get a cert, SSH in

---

## Want to self-host instead?

If you'd rather run Secuird on your own infrastructure instead of using secuird.tech, that's covered separately.

→ [Self-Hosting Guide](/docs/deployment/self-hosting)
