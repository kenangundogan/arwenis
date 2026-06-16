# Claude Code

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

For **this project's own** architecture and conventions (the RAG assistant, admin/member auth split, assistant collections & globals, access patterns), use the Arwenis skill at `.claude/skills/arwenis/`.
Start with `.claude/skills/arwenis/SKILL.md`, then see `.claude/skills/arwenis/reference/` for details. (The `payload` skill = generic Payload; the `arwenis` skill = this repo.)

**Authoritative Payload reference (source of truth):** the official Payload docs **matching our installed version (3.85.1)** are vendored in-repo at `docs/payloadcms/` (full MDX). Consult them for exact Payload behavior — **prefer them over training assumptions.** The `payload` skill is a curated quick-reference; `docs/payloadcms/` is the ground truth.
