---
name: Recipe editor policy
description: Why recipe editing uses a repository review workflow rather than an admin dashboard or public API.
---
New recipe editing uses a trusted-operator, repository-based review workflow. Do not expose its file approval commands as a public API or represent reviewer aliases as authenticated identities.

**Why:** The user explicitly deferred the admin dashboard. The editorial requirement was to add Egyptian dishes safely with actual dish-matched photos, documented reuse rights, a draft preview and an explicit approved release, without duplicating account/payment work.

**How to apply:** Keep additions separate from live content until reviewed. Treat changes to prepared recipe IDs or content as a separate update policy, never a slug rename. If a browser editor is later requested, use the existing managed account system and explicit server-side editor authorization rather than inventing a parallel login.
