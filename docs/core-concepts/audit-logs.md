---
id: audit-logs
title: Audit Logs
sidebar_position: 5
---

# Audit Logs

Every security-relevant action in Secuird gets logged — sign-ins, cert requests, member changes, CA operations, MFA enrolments, policy changes. Everything.

Logs are immutable. Secuird never deletes them automatically.

---

## What's recorded

Each entry captures: who did it, what they did, which org it was in, which resource was affected, the IP and user agent, whether it succeeded, and a timestamp. Nothing is left out.

---

## Viewing logs

Admins can see the full org activity from **Audit Logs** in the sidebar. You can filter by action type, user, or date range.

Members can see their own activity only.

![Audit Logs page — filterable log of every security-relevant action in the org](/img/screenshots/audit.png)

---

## Retention

Secuird never auto-deletes audit logs — that's your call based on your compliance requirements. SOC 2 and ISO 27001 typically require one year. HIPAA requires six.

---

## What gets logged

Every major action has its own event type:

- Sign-ins, logouts, failed attempts
- SSH key uploads, cert requests, cert issuance
- CA creation, key rotation
- Member invites, role changes, suspensions
- MFA enrolment, failures, backup code use
- Policy changes, per-user overrides
- OIDC client creation and token events
- Department and principal changes
