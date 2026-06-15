# Architecture — RAG Pipeline & Assistant Engine

## Request lifecycle (`POST /api/assistant/chat`)

The chat endpoint (`src/endpoints/assistant/chat.ts`) is the **only custom endpoint** — SSE streaming has no Payload-native equivalent. Flow:

```
assertSameOrigin(req)                      # CSRF (sec-fetch-site) — custom endpoints aren't auto-protected
parse body → message (cap 4000 chars)
resolveMember(req) → 401 if not logged in  # req.user.collection === 'members'
loadAssistantConfig(payload)               # aggregates the 7 config globals
rate-limit: per-IP (perIpRateLimit/min) + per-member (100/hour) → 429
checkDailyCap(payload, dailyMessageCap) → 429
conversation caps: maxConversationsPerUser (new) / maxConversationMessages (existing) → 409
getOrCreateConversation()                  # persistEnabled = memory.persistConversations !== false
load history (DB window) or sanitize client history (if persist off)
build userContext: name (firstName+lastName||email) + memories (K4) + prior summary (K3b)
─── stream (ReadableStream + AbortController) ───
  contextualizeQuery(settings, history, message)     # collapse follow-ups into a standalone query
  citations = retrieve(settings, query)              # vector search + minScore filter
  if citations.length === 0:                         # §RAG-rule 1
      full = noContextReply ; send text ; (no LLM call)
  else:
      messages = buildContext({ systemPrompt, persona, userContext, citations, history, userMessage })
      stream LLM tokens (adapter, signal: abort.signal) → send 'text' deltas; capture 'usage'
      usedCitations = extractUsedCitations(full, citations)   # §RAG-rule 2 (gating)
      send 'citations'
  finalize()    # idempotent: persistTurn (msgs + counters) + generateTitle (first turn) + incrementUsage
  send 'done'
  runMemory()   # summarizeAndExtract → update conversation.summary + saveMemories (cross-conv facts)
  cancel(): abort.abort()  # client disconnect → abort LLM, persist partial via finalize()
```

SSE events: `{type:'conversation',id}`, `{type:'text',text}`, `{type:'citations',citations}`, `{type:'done',usage}`, `{type:'error',message}`.

Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no` (disables nginx/k8s buffering — critical in prod).

## Memory layers

- **K1 — identity:** member name injected into every turn.
- **K3a — in-conversation:** last N messages (`historyWindow`, sliding window).
- **K3b — conversation summary:** `summarizeAndExtract` updates `conversation.summary` each turn; re-injected as `priorSummary`.
- **K4 — cross-conversation memory (ChatGPT "Memory" style):** durable facts about the member. Extraction **piggybacks on the K3b summary call** → one LLM call returns `{ summary, newFacts }` → no extra cost. Saved to the `memory` collection (dedup + cap). Runs even on no-context turns (the `citations>0` guard was intentionally removed).

## Provider registry

`src/lib/assistant/providers.ts` is the **single source of truth** for selectable providers. A "provider" is a panel option; an "adapter" is the code that talks to an API. Many providers → few adapters (most speak OpenAI-compatible).

```ts
LLM_PROVIDERS:    openai-compatible | openrouter | anthropic | gemini   (each: id, label, adapter, baseUrl?, editableBaseUrl, defaultModel?)
VECTOR_PROVIDERS: pinecone | qdrant | weaviate                          (supportsTextQuery flag)
EMBEDDING_PROVIDERS: openai | openai-compatible | gemini | none
```

**Security — `editableBaseUrl`:** hosted providers (openrouter/anthropic/gemini) have `editableBaseUrl: false`; their `baseUrl` is FIXED from the catalog and **cannot** be set via the panel. Only `openai-compatible` (self-hosted/Azure/Ollama) allows a custom `baseUrl`. `config.ts#resolveLLM` enforces this server-side: for non-editable providers it uses `provider.baseUrl` and ignores any stored value. Even editable baseUrls pass `assertSafeBaseUrl` (blocks cloud-metadata IPs — SSRF). Admin globals only show the `baseUrl` field when `isBaseUrlEditable(provider)`.

Adding a provider = one entry in the relevant array (+ a new adapter only if it's a new protocol).

## Config resolution

`config.ts` turns the panel config into runtime config:
- `resolveLLM(settings)` → `{ providerId, adapter, baseUrl, apiKey, model, maxTokens, temperature }` (throws `ConfigError` if misconfigured).
- `resolveRetrieval(settings)` → vector connection + topK/minScore/textKey/supportsTextQuery.
- `resolveEmbedding(settings)` → provider/baseUrl/apiKey/model/dimensions. **Critical:** embedding model + `dimensions` MUST match the model that indexed the vector DB, or retrieval silently breaks.

## Limits & usage

- **Limits global** (`limits`): `dailyMessageCap`, `perIpRateLimit`, `maxConversationMessages`, `maxConversationsPerUser` (0 = unlimited). Enforced in the chat endpoint (429/409).
- **`usage.ts`:** `todayKey()` (UTC YYYY-MM-DD), `checkDailyCap()`, `incrementUsage(tokens)`. Writes the `usage` collection with **atomic `$inc`** via the mongoose model (`payload.db.collections.usage`), falling back to `payload.update`. Token count falls back to `estimateTokens(text)` when the provider doesn't report usage.
- **`rateLimit.ts`:** in-memory fixed-window `checkRateLimit(key, max, windowMs)` (cap 10k entries) + `getClientIp(headers)` honoring `TRUSTED_PROXY_HOPS` (anti-XFF-spoof). Payload 3 has no native rate-limit config; for production, prefer edge (nginx/Cloudflare).
- **No USD cost.** Usage is messages + tokens only.

## LLM adapter contract

All adapters (`llm/openai-compatible|anthropic|gemini`) normalize to a common async-iterable `StreamEvent`: `{type:'text',text}`, `{type:'usage',inputTokens,outputTokens}`, `{type:'done'}`, `{type:'error',message}`. `normalize.ts` fixes role ordering (Anthropic/Gemini require alternating roles, first = user). `sse.ts` parses provider SSE. `collectText()` is the non-streaming helper (used for title/summary/contextualize).
