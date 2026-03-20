---
id: what-is-secuird
title: What is Secuird?
sidebar_position: 2
---

# What is Secuird?

Secuird is a self-hosted SSH access management platform built on a Certificate Authority model.

---

## The problem

Managing SSH access with `authorized_keys` doesn't scale:

- Adding a user means copying their key to every server they need.
- Removing a user means hunting it down on every server — under time pressure if a key is compromised.
- Keys don't expire. A leaked key stays valid until someone manually removes it.
- There's no audit trail of who accessed what.

---

## The solution

Instead of distributing individual keys, Secuird runs a CA that your servers trust. When a developer needs SSH access, Secuird signs their public key and issues a short-lived certificate. Servers accept any certificate signed by the CA — they don't track individual users at all.

When someone leaves, remove them from the org. Their certificate expires on its own; nothing changes on the servers.

---

## Two CAs, two purposes

**User CA** — signs developer certificates. Servers trust this CA to grant SSH access. Each certificate carries principals that define which usernames and server groups the holder can access.

**Host CA** — signs server host keys. Developers trust this CA so SSH stops asking "are you sure you want to connect?" on every new server. Add the Host CA public key to `~/.ssh/known_hosts` once and you're done.

---

## Authentication

Users sign in with Google, GitHub, or Microsoft OAuth — no Secuird-specific passwords. Signing in with the same email across providers maps to the same account.

MFA (TOTP or passkey) can be required org-wide before any certificate is issued.

---

## The two projects

- **secuird-api** — Flask + PostgreSQL backend. Runs the CA, handles auth, stores everything.
- **secuird-ui** — React frontend. Used by admins and users accepting invitations.
- **secuird CLI** — What developers use daily to register keys and request certificates.
