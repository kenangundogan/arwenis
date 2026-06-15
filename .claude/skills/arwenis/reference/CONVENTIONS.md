# Conventions & Decisions

## Core decisions

- **Single-tenant, self-hosted, provider-agnostic.** One install serves one organization; it brings its own LLM/vector/embedding via the panel.
- **Admin ≠ member.** Two separate Payload auth collections; members never reach `/admin`. See [AUTH-AND-ACCESS.md](AUTH-AND-ACCESS.md). This is the most-emphasized project rule — never blur it.
- **Member auth = login required, no anonymous.** Email/password (native) + Google/Apple OAuth (planned, via `member-accounts`).
- **No hardcode (panel-driven).** Providers, prompts, limits, branding, locale all come from the admin panel; defaults seeded in `promptDefaults.ts` and field `defaultValue`s, all editable.
- **Native-first.** Prefer Payload built-ins (CRUD, auth ops, `join`, hooks, field access) over custom code. The only custom endpoint is `chat` (SSE). Registration = native `create`. Do not reintroduce custom CRUD/register endpoints.
- **No USD cost tracking.** Usage = messages + tokens only; a static price table is never accurate. Dashboards may multiply tokens by the org's own rate externally.
- **Modular config globals.** The 7 config globals stay separate (not merged into one tabbed global) — deliberate.
- **No comments in source.** `.ts/.tsx` is kept comment-free by decision; rely on this skill + admin `description`s + naming. (Don't add explanatory comments back.)
- **Turkish UI, single locale `tr`.** All labels, `admin.description`, validation messages, user-facing strings are Turkish. `localized: true` fields are kept (multi-lang ready) but only `tr` is active.

## Validators (`src/utilities/validators.ts`)

- `composeValidators(...)` chains; each returns `true` or a message.
- **Optional-safe for `undefined`:** `minLength`/`maxLength` guard `if (value && ...)`. `matches`-based (`onlyText`, `email`, `phone`, `generalText`, slug, etc.) skip non-strings — but reject empty strings. So leave optional fields `undefined`, never `''`.
- `required()` is explicit — omit it for optional fields.
- `phone()` is **strict** (`/^[+]?[(]?\d{3}[)]?[-\s.]?\d{3}[-\s.]?\d{4,6}$/`) — `5XX XXX XXXX` works; many real formats don't. Loosen deliberately if registration UX needs it.
- Turkish chars (`â/î/û` etc.) are included in `onlyText`/`generalText` and in `slugify`'s char map.

## Project structure (assistant-relevant)

```
src/
  collections/        Members, MemberAccounts, Conversations, Messages, Memory, Folders, Usage,
                      Users, Roles, Permissions, Genders, Countries, Cities, Days, Media + content.ts
  globals/            Theme, Integrations, CookiePolicy (Ayarlar) · Llm, Embedding, Retrieval,
                      Prompts, Persona, MemorySettings, Limits (Asistan Tanımlamaları) + index.ts
  endpoints/          assistant/chat.ts (SSE — the only custom endpoint) + index.ts
  lib/assistant/      the assistant engine (see ARCHITECTURE.md)
  access/             utils (isAdmin/isMember/hasPermission), collection/{withPermission, canReadSecure,
                      memberOwned, preventHardDelete, ...}, field/{basic, selfOrAdmin}, global/withPermission
  app/(frontend)      chat UI (to be (re)built) · (payload) admin+api
  components/admin/   Widgets/Banner (dashboard)
```

## Gotchas

1. **`payload run <script>` needs top-level await.** A floating promise lets the process exit before the work runs (silent, exit 0, no data). Use `const payload = await getPayload({ config })` at top level (config via `@payload-config`).
2. **Legacy members can't log in.** Members created during the old custom-scrypt era have an incompatible password hash; native auth rejects them — recreate.
3. **`curl -g`** for query URLs with `[ ]` (e.g. `where[conversation][equals]=...`) — curl globs brackets otherwise.
4. **Config/auth changes need a dev restart.** Adding/moving endpoints or auth collections registers at boot; `pnpm dev` restart may be required.
5. **Run `pnpm generate:types` after schema changes**, then `npx tsc --noEmit`. The `member-accounts` slug is kebab-case and works (the permissions group field name handles it).
6. **`overrideAccess: true` for server writes** (chat persistence, OAuth member creation, usage) — and these run after the response, so don't bind them to the request's abort signal.
7. **Field-level access is boolean only** (no query constraints) — use it to lock fields; use collection access (`Where`) for row scoping.

## Env vars (`.env.example`)

`DATABASE_URL` · `PAYLOAD_SECRET` · `SERVER_URL` · `FRONTEND_URL` (feeds Payload `cors` + `csrf`) · `CRON_SECRET` · `PREVIEW_SECRET` · `TRUSTED_PROXY_HOPS` (client-IP resolution behind proxies) · `S3_*` (present, adapter not wired yet).

## Tooling & CI

- pnpm. Scripts: `dev`, `build` (Next standalone), `generate:types`, `generate:importmap`, `typecheck` (`tsc --noEmit`), `payload`.
- CI (`.github/workflows/ci.yml`): on push/PR to `main` → pnpm install + `typecheck` + `build` against an ephemeral MongoDB with dummy secrets.
- Docker: `Dockerfile` (standalone output) + `docker-compose.yml`. License: MIT.

## Working-doc files

- `ARWENIS-PLAN.md` — original plan/handoff (parts stale; predates the Payload-native auth move).
- `PROJE-DURUMU.md` — current-state snapshot + TODO.
- Both are intentionally **kept out of git commits** (untracked).

## Remaining roadmap (high level)

- **B3 — Google/Apple OAuth callback** (member-accounts linking, verified-email auto-link).
- **Frontend chat UI** (login/register, streaming chat, sidebar, folders, memory panel, profile).
- reCAPTCHA verify wiring · background jobs (Payload Jobs + cron for summary/memory/retention) · email adapter · S3 adapter · usage dashboard widget.
