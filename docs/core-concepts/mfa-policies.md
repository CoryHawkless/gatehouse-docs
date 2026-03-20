---
id: mfa-policies
title: MFA Policies
sidebar_position: 3
---

# MFA Policies

MFA policies let you require two-factor authentication from everyone in your org. You set the mode, optionally give people a grace period to enrol, and Secuird handles the rest — tracking compliance, sending reminders, and suspending people who miss the deadline.

---

## Policy modes

| Mode | What it means |
|------|---------------|
| Disabled | MFA not required. People can still set it up voluntarily. |
| Optional | MFA is encouraged but not enforced. |
| TOTP | Everyone must have an authenticator app set up. |
| Passkey | Everyone must have a hardware key or biometric registered. |
| Any | Everyone must have either TOTP or a passkey — their choice. |

![Policies page — set org-wide MFA mode, grace period, and per-user overrides](/img/screenshots/policies.png)

---

## Grace period

When you turn on enforcement, people who haven't enrolled yet don't get locked out immediately. You set a grace period (e.g. 14 days). During that time they can still use Secuird normally, but they'll see a banner telling them when the deadline is.

If you set a notification window (e.g. 7 days), Secuird emails them a week before the deadline.

After the deadline, unenrolled users get suspended automatically. Their session is downgraded to compliance-only — they can only access the MFA enrolment page until an admin reinstates them or they enrol.

---

## Per-user overrides

You can exempt specific users from the policy entirely — useful for service accounts that can't use MFA. You can also force a stricter requirement on individual users even if the org mode is more lenient.

---

## Compliance tracking

From **Security** → **MFA Status** you can see the enrolment state of every member — who's compliant, who's in their grace period, who's past due.
