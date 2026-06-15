---
name: arwenis
description: Use when working on the Arwenis project (this repo) — its RAG chat assistant, the admin/member auth split, assistant collections & globals, the chat SSE endpoint, access control, or provider/RAG pipeline. Complements the generic `payload` skill with THIS project's architecture and conventions.
---

# Arwenis — Project Architecture & Conventions

**Arwenis** is a self-hosted, provider-agnostic, **RAG chat assistant** built on Payload CMS 3.85 + Next.js 16 (single repo, single-tenant, MongoDB). An organization plugs in its own LLM / vector DB / embedding via the admin panel, brands it, and runs it on its own server. The assistant answers **only from the org's knowledge base**, cites sources, says "I don't know" instead of hallucinating, and remembers the user across visits.

> This skill documents **this project**. For generic Payload usage, see the `payload` skill. **Rule of thumb: prefer Payload-native over custom.** The only custom endpoint is `chat` (SSE streaming has no native equivalent).

## Quick Reference

| Task | Solution | Details |
| --- | --- | --- |
| Understand the RAG flow | contextualize → retrieve → short-circuit → build → stream → cite | [ARCHITECTURE.md](reference/ARCHITECTURE.md) |
| Add/change assistant config | edit a **global** under "Asistan Tanımlamaları"; read via `loadAssistantConfig()` | [COLLECTIONS-AND-GLOBALS.md#globals](reference/COLLECTIONS-AND-GLOBALS.md#globals) |
| Member-facing data access | `memberOwned*` helpers (own records) | [AUTH-AND-ACCESS.md#member-data-access](reference/AUTH-AND-ACCESS.md#member-data-access) |
| Admin RBAC check | `canRead/canCreate/canUpdate/canDelete('slug')` / `isAdmin` | [AUTH-AND-ACCESS.md#admin-rbac](reference/AUTH-AND-ACCESS.md#admin-rbac) |
| Member registration | native `POST /api/members` (NOT a custom endpoint) | [AUTH-AND-ACCESS.md#registration](reference/AUTH-AND-ACCESS.md#registration) |
| Member login/logout/me | native `/api/members/{login,logout,me}` | [AUTH-AND-ACCESS.md#member-auth](reference/AUTH-AND-ACCESS.md#member-auth) |
| Lock a field from public/member | field-level `access: { create/update: adminOnlyField | notMemberField }` | [AUTH-AND-ACCESS.md#field-level-locks](reference/AUTH-AND-ACCESS.md#field-level-locks) |
| Add a provider (LLM/vector/embed) | one entry in `lib/assistant/providers.ts` | [ARCHITECTURE.md#provider-registry](reference/ARCHITECTURE.md#provider-registry) |
| Show related docs in admin | Payload `join` field (e.g. Conversations → Messages) | [COLLECTIONS-AND-GLOBALS.md#conversations](reference/COLLECTIONS-AND-GLOBALS.md#conversations) |
| Daily usage / caps / rate-limit | `lib/assistant/usage.ts` + `rateLimit.ts` + Limits global | [ARCHITECTURE.md#limits--usage](reference/ARCHITECTURE.md#limits--usage) |
| Run a one-off server script | `pnpm payload run <file>` with **top-level await** | [CONVENTIONS.md#gotchas](reference/CONVENTIONS.md#gotchas) |

## Golden Rules (project-specific)

1. **Admin (`users`) and member (`members`) are two SEPARATE Payload auth collections.** A member can **never** reach `/admin` (`admin.user: 'users'`). Members have no `roles` field, so admin RBAC checks bail for them. **Never** merge these or grant members admin scope. See [AUTH-AND-ACCESS.md](reference/AUTH-AND-ACCESS.md).
2. **Native-first.** Use Payload's built-in operations (CRUD, auth login/logout/me, `join`, hooks, field access) instead of hand-rolled endpoints. The **only** justified custom endpoint is `POST /api/assistant/chat` (SSE). Registration is native `create`; CRUD is native REST.
3. **No hardcode (panel-driven).** LLM/vector/embedding/prompts/limits/branding/locale all come from the admin panel. Sensible defaults are in `promptDefaults.ts`; everything stays editable.
4. **Secrets are field-level admin-only.** `apiKey`/`secretKey`/`privateKey` use `access: { read: adminOnlyField, update: adminOnlyField }` and never leave the server.
5. **Turkish UI.** All admin `label`/`admin.description`, validation messages, and user-facing strings are Turkish. Single locale `tr`.
6. **No comments in source.** Source `.ts/.tsx` is kept comment-free by project decision (knowledge lives in this skill + descriptions instead).

## The Assistant Engine (`src/lib/assistant/`)

```
providers.ts      LLM/vector/embedding catalog (registry). baseUrlEditable flag = SSRF guard.
config.ts         resolveLLM/resolveRetrieval/resolveEmbedding + assertSafeBaseUrl (SSRF: blocks cloud metadata IPs)
loadConfig.ts     loadAssistantConfig(payload) — aggregates the 7 "Asistan Tanımlamaları" globals into one object
llm/              openai-compatible, anthropic, gemini adapters + sse + normalize + index (StreamEvent contract)
embedding/        openai / openai-compatible / gemini / none
vector/           qdrant / pinecone / weaviate adapters + index (retrievePassages, toCitation, safeHttpUrl)
retrieve.ts       contextualizeQuery + retrieve (embed if needed)
buildContext.ts   system (guardrail) + persona + sources + [n] instruction + caps
guardrails.ts     prompt template fill, source sanitize, citation gating (only used [n] returned)
summarize.ts      summarizeAndExtract → { summary, newFacts } in ONE LLM call
store.ts          getOrCreateConversation / loadHistory / persistTurn / generateTitle / loadMemories / saveMemories / countConversations
usage.ts          todayKey / checkDailyCap / incrementUsage (atomic $inc via mongoose model, falls back to payload.update)
rateLimit.ts      in-memory per-IP fixed-window + getClientIp (TRUSTED_PROXY_HOPS aware)
promptDefaults.ts DEFAULT_PERSONA / SYSTEM / NO_CONTEXT / SUMMARY / MEMORY_EXTRACT / TITLE / CONTEXTUALIZE
auth/             resolveMember(req) (reads req.user, collection==='members') + csrf (assertSameOrigin)
```

## Critical RAG Rules

These are non-negotiable engineering rules baked into the chat flow:

1. **Empty retrieval → no LLM call.** If vector search returns 0 passages (after `minScore`), stream the `noContextReply` instead of calling the model.
2. **Citation gating.** Model marks used sources with `[n]`; the server returns **only** the cited passages. Sanitize `[n]`-like patterns out of passages first (anti-forgery).
3. **Grounding + injection guardrail.** Sources are untrusted; persona can't override safety; answer in the user's language.
4. **Post-response writes use `overrideAccess: true` without `req`'s abort signal.** The stream's `finalize()` persists after the response; it must not bind to an aborted request.
5. **Abort on disconnect.** `AbortController` + `cancel()` aborts the LLM call and persists the partial reply.
6. **No USD cost estimate.** Track messages/tokens only (a static price table is never accurate) — see [CONVENTIONS.md](reference/CONVENTIONS.md).

See [ARCHITECTURE.md](reference/ARCHITECTURE.md) for the full request lifecycle.

## Common Gotchas (this project)

1. `payload run <script>` needs **top-level await** — a floating promise exits the process early (silent, no data).
2. `members` created in the legacy custom-scrypt era **can't log in** under native auth (incompatible hash) — recreate them.
3. The `phone()` validator is **strict** (`5XX XXX XXXX` style); arbitrary formats are rejected.
4. Validators are **optional-safe** for `undefined` but `matches`-based ones (onlyText/email/phone) reject empty strings — keep optional fields `undefined`, not `''`.
5. `curl` treats `[ ]` in query URLs as globbing — use `curl -g` for `where[field][equals]=...`.
6. Collection/global config changes (endpoints, auth) usually need a `pnpm dev` **restart** to register.
7. After schema changes run `pnpm generate:types`; verify with `npx tsc --noEmit` (CI gate).

## Reference Documentation

- **[ARCHITECTURE.md](reference/ARCHITECTURE.md)** — RAG request lifecycle, the `lib/assistant` engine, provider registry, limits/usage, the chat SSE endpoint.
- **[AUTH-AND-ACCESS.md](reference/AUTH-AND-ACCESS.md)** — the admin/member split, RBAC, `memberOwned`/field-level access, member-accounts (multi-provider), registration, OAuth plan.
- **[COLLECTIONS-AND-GLOBALS.md](reference/COLLECTIONS-AND-GLOBALS.md)** — every assistant collection & global, their fields, access, and the `loadConfig` aggregator.
- **[CONVENTIONS.md](reference/CONVENTIONS.md)** — decisions, native-first policy, Turkish UI, validators, no-comments rule, gotchas, env vars, CI.
