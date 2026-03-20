---
id: organizations
title: Organizations
sidebar_position: 2
---

# Organizations

An organization is the container for everything in Secuird — your team, CAs, departments, SSH access policies, and MFA settings. Everything is scoped to an org. One Secuird account can belong to multiple organizations.

---

## Structure

**Owner** — whoever created the org (or whoever ownership was transferred to). There's always exactly one. Full control, including deleting the org.

**Admins** — can manage members, departments, CAs, and policies. Can't delete the org or transfer ownership.

**Members** — can add SSH keys, request certificates, and view their own profile. Nothing else.

**Guests** — read-only.

---

## Departments

Departments group your team and define what they can access. Each department has a set of principals (the named strings that end up in SSH certificates) and a certificate validity period.

When you assign someone to a department, their next cert gets those principals automatically. Move someone to a different department and their next cert reflects the change.

---

## Principals

A principal is a named access group — e.g. `engineers`, `prod-servers`. It's the string embedded in an SSH certificate that `sshd` checks against the `AuthorizedPrincipals` file on the server.

You link principals to departments. Everyone in that department gets those principals in their certs.

---

## Invitations

Invite someone by email. If they don't have a Secuird account yet, they'll see the invite after they sign up. Invites can be revoked before they're accepted.

---

## Multi-org membership

A user can be in multiple orgs at the same time. Each membership has its own role and MFA compliance status — being an admin in one org doesn't give you anything in another.

---

## API reference

→ [Organizations API](/docs/api-reference/organizations)
