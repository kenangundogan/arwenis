# Collections & Globals

All admin labels/descriptions are Turkish. Admin nav groups: **Asistan** (assistant data), **Asistan Tanımlamaları** (assistant config globals), **Ayarlar** (settings globals), **Kullanıcı Yönetimi** (users/roles/permissions), **Coğrafya Yönetimi**, **Tanımlar**, **İçerik**.

## Collections

Registered in `src/collections/content.ts` → `contentCollections`.

### users (admin auth)
Payload auth. Rich profile (tabs: General, Cinsiyet, Adresler, Telefon, Görseller). `roles` (→roles), `permissions` drive RBAC. First user auto-admin via `ensureFirstUserIsAdmin`. `trash` + drafts. Group: Kullanıcı Yönetimi. **Separate from members.**

### roles / permissions
Admin RBAC. `roles`: title/slug (`admin` = superuser). `permissions`: per-user resource×scope×actions (the real authorization source).

### members (chat auth)
Payload auth (see [AUTH-AND-ACCESS.md](AUTH-AND-ACCESS.md)). Fields: `email` (unique, locked from member update), `password` (hidden, locked), `status` (active/blocked, admin-only), `locale`, `lastSeenAt` (server). Profile tabs (member-editable): Genel (firstName, lastName, birthDate), Cinsiyet (gender→genders), Adres (country→countries, city→cities, district, address), İletişim (gsm, landline — strict `phone()`), Avatar (single optional upload→media). Access: `create:()=>true` (public register), `read:canReadSecure`, `update:memberSelfUpdate('members')`, `delete:canDelete`. `beforeLogin` blocks `blocked`; `beforeDelete: preventHardDelete`; `trash:true`.

### member-accounts
Linked login methods (multi-provider). `member`(rel) + `provider`(google/apple) + `providerAccountId`. Compound-unique via beforeValidate. `create:()=>false` (server/OAuth), `read/delete: memberOwned*`. Group: Asistan.

### conversations
A chat session/thread (one per ChatGPT-style sidebar entry; groups messages). Server-written, member-scoped.
- Fields: `member`(rel, locked), `folder`(rel→folders, member-settable), `title`, `summary`(K3b, locked), `status`(active/archived, **member-settable** for archive), `messageCount`/`tokensTotal`/`lastMessageAt`(locked counters), and a **`messages` `join` field** (`collection:'messages'`, `on:'conversation'`, `defaultSort:'createdAt'`) that surfaces related messages in the admin edit view.
- Access: `create:()=>false` (server only), `read/update/delete: memberOwned*`. `trash:true` + `preventHardDelete`.

### messages
A single turn within a conversation (one user question OR one assistant answer; a turn = 2 messages). Fields: `conversation`(rel), `member`(rel, denormalized for scoping), `role`(user/assistant), `content`, `citations`(json `[{n,title,url,score}]`), `tokensIn`/`tokensOut`, `feedback`(👍/👎). Access: `create:()=>false`, `read: memberOwnedRead`, `update: memberOwnedUpdate` (member can set **only `feedback`** — all other fields `notMemberField`), `delete: canDelete`.

### memory
Cross-conversation durable facts (K4). `member`(rel) + `text`. `create/update:()=>false`, `read/delete: memberOwned*` (member sees/deletes own — KVKK-style real delete). Server extracts via `summarizeAndExtract`.

### folders
Member's chat folders. `member`(rel, forced by beforeValidate) + `name`. `create: memberCreate`, `read/update/delete: memberOwned*`. **`afterDelete` hook** clears `conversations.folder` (no orphan references).

### usage
Daily counter. `day` (YYYY-MM-DD, indexed) + `messageCount` + `tokenCount`. Read-only (`create/update:()=>false`, `read: canRead('usage')`, admin). Written server-side via atomic `$inc` (`lib/assistant/usage.ts`). **No USD.**

### reference + media
`genders` / `countries` (iso2, dialCode) / `cities` (→country, plateCode) / `days` — localized lookup data, admin-managed, shared. `media` — uploads (read public, write RBAC).

## Globals

### Asistan Tanımlamaları (config — 7 globals)
All admin-only (`canReadGlobal`), drafts enabled. Read at runtime via `loadAssistantConfig()`. **Kept as separate modular globals by decision — do not merge into one tabbed global.**

| Global | Holds |
| --- | --- |
| `llm` | provider (registry), model, `apiKey`🔒, baseUrl (only if `isBaseUrlEditable`), maxTokens, temperature |
| `embedding` | provider, baseUrl (conditional), model, `apiKey`🔒, dimensions |
| `retrieval` | provider, url, `apiKey`🔒, index, namespace, topK, minScore, textKey |
| `prompts` | systemPrompt, noContextReply, summaryPrompt, memoryExtractPrompt, titlePrompt, contextualizePrompt (defaults from `promptDefaults.ts`, localized) |
| `persona` | welcomeMessage, persona, suggestedQuestions (array) — localized |
| `memorySettings` | persistConversations, historyWindow, crossConversation, retentionDays (slug `memorySettings` to avoid clashing with the `memory` collection) |
| `limits` | dailyMessageCap, perIpRateLimit, maxConversationMessages, maxConversationsPerUser |

Secrets use `access: { read: adminOnlyField, update: adminOnlyField }`.

### Ayarlar (settings — 3 globals)
- `theme` — name, brandColor (hex), logo (SVG→media), logoAlt, favicon (ico + svg). `afterChange: revalidateTheme`.
- `integrations` — Google/Apple OAuth + reCAPTCHA, each a group with its own `enabled` toggle + credentials (secrets 🔒, fields conditional on `enabled`). Auth methods are turned on here per-provider (no separate `access.authMethods`).
- `cookiePolicy` — enabled + richText content + accept/reject buttons.

> There is **no** `access` global and **no** `diagnostics` global (both removed). KVKK/consent was removed.

## loadConfig aggregator {#globals-aggregator}

`src/lib/assistant/loadConfig.ts` → `loadAssistantConfig(payload, { draft?, locale? })` runs `findGlobal` for the 7 config globals in parallel and returns one `AssistantConfig` object (`{ llm, embedding, retrieval, prompts, memory, limits, persona, welcomeMessage, suggestedQuestions }`). Runtime code (`resolveLLM`, chat, store) reads this — so the modular globals don't force consumers to know about 7 separate sources.

## Frontend config (no public endpoint needed)
Globals are admin-only, so the frontend reads branding/welcome/suggestedQuestions/enabled-auth-methods via the **Local API in a server component** (with `overrideAccess`, returning only the safe subset) — the Payload-in-Next native pattern. Add a thin public `/api/assistant/config` endpoint only if a client component needs dynamic fetch.
