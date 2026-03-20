---
id: sessions
title: Sessions
sidebar_position: 4
---

# Sessions

When you sign in, Secuird creates a server-side session and gives you a token. That token is how the API knows who you are on every request.

Sessions are stored server-side — not JWTs. That means they can be revoked instantly. If someone's laptop gets stolen, an admin can kill their session and it's gone immediately, no waiting for a token to expire.

---

## Session lifetime

A normal session lasts 24 hours. After that you sign in again.

---

## Managing sessions

You can see all your active sessions from the UI — each one shows the device, IP, and when it was created. You can kill individual sessions (useful for "log out my home computer") or log out everywhere at once.

---

## Compliance-only sessions

If your org has MFA enforcement and your grace period runs out before you've enrolled, your session gets restricted. You can still log in, but you can only reach the MFA enrolment pages. Everything else returns a 403 until you enrol.
