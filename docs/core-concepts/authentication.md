---
id: authentication
title: Authentication
sidebar_position: 1
---

# Authentication

Secuird doesn't have its own password system for signing in to the platform — you use Google, GitHub, or Microsoft. Signing in with the same email across providers maps to the same account, so your team doesn't need to remember a separate Secuird password.

---

## How sign-in works

When you sign in, Secuird starts an OAuth flow with whichever provider you pick. After the provider confirms who you are, Secuird issues you a session token. That's it — no Secuird-specific passwords to set or reset.

If your org has MFA enabled, you'll be prompted for a second factor after the OAuth step.

![Secuird login — email/password or one-click OAuth with Google, GitHub, or Microsoft](/img/screenshots/login.png)

---

## MFA

Two options:

**TOTP** — scan a QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.) and enter a 6-digit code when you sign in. You get 10 backup codes when you enrol — keep them somewhere safe.

**Passkey** — register a hardware key or biometric (YubiKey, Touch ID, Windows Hello). More secure than TOTP because it's phishing-resistant. If you have both enrolled, Secuird always asks for the passkey.

Admins can require one or both methods org-wide. See [MFA Policies](mfa-policies).

---

## Sessions

After you sign in, Secuird gives you a session token. Sessions are server-side — they can be revoked instantly, unlike JWTs. A normal session lasts 24 hours. You can see all your active sessions and kill any of them from the UI.

If your MFA grace period expires before you enrol, your session gets downgraded — you can only access the MFA enrolment pages until you sort it out.

![Security page — manage active sessions, MFA methods, and passkeys](/img/screenshots/security.png)

---

## API reference

→ [Auth API](/docs/api-reference/auth)
