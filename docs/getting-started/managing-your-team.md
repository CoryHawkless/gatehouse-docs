---
id: managing-your-team
title: Managing Your Team
sidebar_position: 5
---

# Managing Your Team

CAs are set up, servers are configured. Now you bring people in.

---

## Inviting members

**Members** → **Invite**. Enter an email, pick a role, assign a department, send. They get an email with a link. They sign in with Google/GitHub/Microsoft and land in the org.

![Members page — invite, view roles, suspend or remove users](/img/screenshots/members.png)

Roles:

- **Member** — can add SSH keys, request certs, view their own stuff
- **Admin** — can also manage members, departments, CAs, and policies
- **Owner** — full control, including deleting the organization

---

## Departments

A department answers two questions: *what can this group access?* and *for how long?*

Each department has:

- **Principals** — the strings baked into certificates. They must match what's in `/etc/ssh/auth_principals/` on your servers.
- **Certificate validity** — how long a cert lasts. 8 hours for prod, 24 hours for dev, whatever makes sense.

To create one: **Departments** → **Create Department**. Name it, add principals, set validity.

![Departments page — define access groups with principals and cert validity](/img/screenshots/departments.png)

To move someone: go to their profile, change their department. Their next cert picks up the new principals.

---

## Suspending and removing people

**Suspend** — they can't request new certs. Whatever cert they have expires on its own. You don't need to touch any servers. Find them in the members list and click **Suspend**.

**Remove** — gone from the org entirely. Same deal — current cert expires naturally, no server-side cleanup.

---

## MFA enforcement

If you set an MFA policy with a grace period:

- Users see a banner with the deadline
- After it passes, anyone who hasn't enrolled gets suspended automatically
- An admin can reinstate them after they enrol

Check who's enrolled and who's not from **Security** → **MFA Status**.

![Security & Policies page — configure MFA requirements and compliance settings](/img/screenshots/policies.png)

→ [SSH Keys & Certificates](ssh-keys-and-certificates) — the developer side of things
