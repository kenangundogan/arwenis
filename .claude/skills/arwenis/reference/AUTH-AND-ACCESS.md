# Auth & Access

## The two-side model (NON-NEGOTIABLE)

Arwenis has **two completely separate Payload auth collections**:

| | `users` (admin) | `members` (chat end-users) |
| --- | --- | --- |
| Purpose | Admin panel operators | Assistant chat users |
| Admin panel | ✅ `admin.user: 'users'` | ❌ **can never reach `/admin`** |
| Authorization | `roles` + per-user `permissions` (RBAC) | none — own data only |
| Data access | RBAC helpers (`canRead` etc.) | `memberOwned*` helpers |

**How separation is enforced (do not break these):**
- `admin.user: 'users'` in `payload.config.ts` → only the `users` collection authenticates into the admin UI. `members` is a separate auth collection and cannot log into `/admin`.
- `members` has **no `roles` field** → every admin RBAC check bails via `if (!('roles' in user)) return false` (`src/access/utils.ts`). No admin permission can leak to a member.
- `isMember(user)` (`src/access/utils.ts`) distinguishes by `user.collection === 'members'`.
- `AuthUser = User | Member`. The access layer was intentionally adapted to handle both — this is correct. (A half-baked earlier version was rejected; the current one is clean.)

> Historical note: `members` was once `endUsers` with a custom signed-cookie + scrypt auth ("not a Payload auth collection"). That was **replaced** by Payload-native auth. Any doc/memory saying "members is not a Payload auth collection / never touch the access layer" is **outdated**.

## Member auth

Native Payload auth operations (auto-generated for the `members` auth collection):
- `POST /api/members/login` → sets httpOnly cookie + returns token/user
- `POST /api/members/logout`
- `GET /api/members/me`
- `POST /api/members/refresh-token`, `/forgot-password`, `/reset-password`

`resolveMember(req)` (`src/lib/assistant/auth/resolveMember.ts`) reads `req.user` (Payload populates it from the member cookie/JWT), returns the `Member` if `collection === 'members'`, throws 403 if `status === 'blocked'`. A `beforeLogin` hook on `members` also blocks `blocked` members.

`auth` config on `members`: `tokenExpiration` 30d, `maxLoginAttempts` 5, `lockTime` 10min, `cookies.sameSite: 'Lax'`. CSRF: Payload `csrf` config (FRONTEND_URL) + SameSite + `assertSameOrigin` (sec-fetch-site) on custom endpoints.

## Registration

**Registration is native `create`, NOT a custom endpoint.** `members.access.create: () => true` (public). A client `POST /api/members` with `{ email, password, firstName, ... }` creates the member (Payload hashes the password).

Sensitive fields are protected at the **field level** so the public can't set them on create:
- `status`, `lastSeenAt` → `access: { create: adminOnlyField }` (public value stripped → defaults apply).
- The OAuth flow sets provider fields server-side with `overrideAccess: true` (bypasses field access).

There is **no** `/api/assistant/auth/register` — it was removed in favor of native `create`. Anti-abuse (rate-limit/verify) belongs in edge or `auth.verify` (email), not a hand-rolled endpoint.

## Admin RBAC

`src/access/` — admin authorization built ON Payload's native access functions (Payload has no built-in RBAC). Sources of truth:
- `roles` collection: `admin` slug = superuser. `isAdmin(user)` = `user.roles.slug === 'admin'`.
- `permissions` collection: **per-user**, `user` (unique) + `isActive` + per-resource `{ scope: none|own|all, actions: [...] }`.
- `hasPermission(req, user, resource, action)` consults the permission record; `isAdmin` short-circuits to allow.

Collection access factories (`access/collection/withPermission.ts`): `canCreate/canRead/canUpdate/canDelete/canReadVersions(resource)`. `canReadSecure(resource)` returns a `Where` for own/all scoping. Field factories: `adminOnlyField`, `readOnlyField`, `selfOrAdminField`. Global: `canReadGlobal/canUpdateGlobal(slug)`.

`preventHardDelete` (beforeDelete hook): native `trash` lets anyone with delete access permanently delete (modal checkbox); this hook adds a separate `hardDelete` permission gate (admin bypass). It is **complementary** to native trash, not a reinvention.

## Member data access

`src/access/collection/memberOwned.ts` — helpers for member-facing collections (conversations/messages/memory/folders/member-accounts):

```ts
memberOwnedRead(resource)   // member → { member: { equals: id } } ; else canReadSecure(resource)
memberOwnedDelete(resource) // member → own ; else canDelete(resource)
memberOwnedUpdate           // member → own ; non-member → false (server writes use overrideAccess)
memberCreate                // members only (ownership forced by a beforeValidate hook)
memberSelfUpdate(resource)  // for the members collection itself: member → { id: equals self } ; else canUpdate(resource)
notMemberField              // FieldAccess: !isMember (block members from writing server-managed fields)
```

Ownership is keyed by the `member` relationship field on the doc; for the `members` collection itself it's keyed by `id` (`memberSelfUpdate`). For member-CREATE collections (folders), a `beforeValidate` hook forces `data.member = req.user.id` so a member can only create records owned by themselves.

## Field-level locks

Pattern: open the collection `update`/`create` to the member, then lock the fields they must NOT touch with `access: { update: notMemberField }` (and `create: adminOnlyField` for server-set fields). Examples:
- **Members:** member edits profile (firstName/lastName/gender/address/phones/avatar/locale); `email`, `password`, `status`, `lastSeenAt` are locked.
- **Messages:** member can set only `feedback` (👍/👎) on their own message; `content`/`role`/`citations`/`tokens` locked.
- **Conversations:** member can set `title`, `folder`, `status` (archive); `summary`/`messageCount`/`tokensTotal`/`lastMessageAt`/`member` locked.

## Multi-provider accounts (member-accounts)

`member-accounts` collection links **one member ↔ many providers** (industry-standard identity + accounts model, like NextAuth):
- Fields: `member` (rel), `provider` (google/apple/...), `providerAccountId` (OAuth sub). Compound-unique `(provider, providerAccountId)` via a `beforeValidate` hook (409 on clash).
- Access: `create: () => false` (server/OAuth only via overrideAccess), `read/delete: memberOwned*` (member sees/unlinks own).

**OAuth sign-in flow (B3, schema ready, callback TODO):**
1. Verify provider token → `(provider, sub, email, emailVerified)`.
2. Find member-account by `(provider, sub)` → log in that member.
3. Else find member by **verified** email → link (create account row) → log in.
4. Else create member + account → log in.
5. **Auto-link only on verified email** (account-takeover guard). OAuth-only members get a random password (login is via the provider).
