# Frontend — Chat UI (plan & structure)

> Status: **to be built** (the `(frontend)` route group is currently the Payload starter). This file is the spec; the task checklist lives in `PROJE-DURUMU.md`. The backend API is complete (see [ARCHITECTURE.md](ARCHITECTURE.md), [AUTH-AND-ACCESS.md](AUTH-AND-ACCESS.md)).

## Stack decisions

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 App Router, `src/app/(frontend)` route group | same repo as Payload; admin is `(payload)` and untouched |
| Styling | **Tailwind v4** (installed) | **scoped** so it never bleeds into the admin's `@payloadcms/ui` SCSS |
| Components | **eglador-ui-react** (team's own) — or shadcn/ui — *pick one, see "Component library" below* | both headless + Tailwind v4 + CSS-var themed; eglador is our own (zero runtime deps, ~70 components incl. dialog/command/sidebar/drawer) |
| Icons | **lucide-react** (installed) | works with either option |
| Markdown | **marked + DOMPurify** (installed) | assistant output is sanitized then rendered; bubble re-renders per token while streaming |
| Data/streaming | native `fetch` + `ReadableStream` reader (SSE) | no data-fetching lib |
| State | React state/context + small hooks | no Redux/zustand initially; add only if needed |
| i18n | simple `tr` dictionary (`_lib/dictionary.ts`) | no hardcoded UI strings; single locale `tr` for now |
| Auth | native member auth (cookie) | `POST /api/members` (register), `/api/members/login\|logout\|me` |

> Layout: **fullscreen, standalone, ChatGPT/Claude-style** (not an embedded widget). Mobile: sidebar collapses to a drawer (eglador `drawer` / shadcn `sheet`).

## Component library

**DECIDED:** primary system = **`eglador-ui-react`** (Option A) + satellites **`typewriter` · `toast` · `text-reveal`** (installed). shadcn (Option B) was the documented alternative, not used. Setup: `@import "tailwindcss"; @source "../../../node_modules/eglador-ui-react";` (+ one `@source` per satellite) in `(frontend)/styles.css`; zinc palette, brand via `--brand`.

### Option A — eglador-ui-react (the team's own) — CHOSEN
`eglador-ui-react` (alpha) — headless, accessible, Tailwind v4, **zero runtime dependencies**, compound-subcomponent API.

**Full set (65 components):** Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Button, ButtonGroup, Calendar, Card, Checkbox, CheckboxGroup, Collapsible, ColorPicker, Combobox, Command, ContextMenu, DatePicker, DateTimePicker, Dialog, Drawer, Dropdown, Dropzone, Empty, Form, HoverCard, ImageCropper, Input, InputGroup, InputOTP, InputTag, Kbd, Label, Link, Menubar, MultiSelect, NativeSelect, NavigationMenu, Notification, NumberInput, Pagination, Popover, Progress, Radio, RadioGroup, Resizable, ScrollArea, Select, Separator, Sidebar, Skeleton, Slider, SpeedDial, Spinner, Stepper, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip, TreeView, Typography.

Chat-UI mapping:
- shell/nav → `Sidebar`, `Drawer` (mobile), `NavigationMenu`, `Menubar`, `ScrollArea`, `Separator`, `Tabs`, `Command` (⌘K search)
- overlays/menus → `Dialog`, `AlertDialog` (ConfirmDialog), `Dropdown`, `ContextMenu` (kebab), `Popover`, `HoverCard`, `Tooltip`
- forms/auth → `Button`, `ButtonGroup`, `Input`, `InputGroup`, `Textarea`, `Form`, `Label`, `Select`, `Switch`, `Checkbox`, `InputOTP`
- feedback → `Spinner`, `Skeleton`, `Progress`, `Avatar`, `Badge`, `Empty`, `Card`, `Typography`, `Notification`

Note: `Notification` (in-app) is built in; the separate `eglador-ui-react-toast` package adds stacked imperative toasts. Pros: our own (full control + extend freely), TW v4 native, zero-dep, broad out-of-the-box set. Con: alpha (`1.0.0-alpha.x`).

### Option B — shadcn/ui
Radix + Tailwind, copy-in components. Pros: large ecosystem, battle-tested Radix a11y. Cons: adds `clsx`/`tailwind-merge`/`cva` + `@radix-ui/*`; not our own; overlaps with what eglador already provides.

### Satellite eglador packages (complement either option)
| Package | Use in Arwenis |
| --- | --- |
| `eglador-ui-react-typewriter` | assistant "typing" effect / animated welcome |
| `eglador-ui-react-toast` | notifications (copy ok, errors) — covers the toast need |
| `eglador-ui-react-text-reveal` | animated welcome / empty-state reveal |
| `eglador-ui-react-sortable` | drag-reorder folders/conversations (uses `@dnd-kit`) |
| `eglador-ui-react-chart` | **admin** usage dashboard (messages/tokens) |
| `eglador-ui-react-carousel` | optional: suggested-questions / onboarding |
| `eglador-ui-react-data-table` | optional custom tables (Payload admin already ships its own) |

All eglador packages: peer deps `react` / `react-dom` / `tailwindcss`; zero runtime deps (except `sortable` → `@dnd-kit`).

## Design style

- Clean, minimal, modern chat. Generous whitespace, rounded message bubbles, a pill-style composer with an animated send/stop button, subtle "thinking" indicator, smart auto-scroll + "jump to latest".
- **Brandable:** the Theme global (`name`, `brandColor`, `logo`, `favicon`) drives the UI. `brandColor` → a `--brand` CSS variable injected in the root layout; the UI library's theme tokens reference it so the org's color flows through buttons/accents. Logo + name in the header.
- Light/dark via CSS variables (system preference); brand accent constant across both.
- Source citations render as **inline chips** (`[n]` → domain-labeled chip opening the source in a new tab); chip href is http(s)-only (already enforced server-side in `citations`).

## Structure

```
src/app/(frontend)/
  layout.tsx                 # <html>/<body>, inject --brand from Theme global (Local API), fonts, Toaster
  globals.css                # tailwind + UI-library theme tokens (CSS vars) + --brand
  (auth)/
    login/page.tsx           # email/password + (later) Google/Apple buttons (if integrations.enabled)
    register/page.tsx
  (chat)/
    layout.tsx               # auth guard (payload.auth on the member cookie → redirect to /login) + Sidebar + main
    page.tsx                 # empty state: welcome message + suggested questions (from Persona global)
    c/[conversationId]/page.tsx
  _components/               # Sidebar, ConversationList, FolderSection, ChatWindow, MessageList, MessageBubble,
                             # ChatInput, SourceChips, MessageActions, MemoryPanel, AccountMenu, ConfirmDialog
  _lib/                      # api.ts (fetch wrappers), sse.ts (chat stream reader), dictionary.ts (tr), types.ts
  _hooks/                    # useChatStream, useConversations, useConfirm
  _components/ui/            # local wrappers over the chosen UI lib (eglador re-exports, or shadcn copy-in)
```

If shadcn is chosen, `components.json` targets `src/components/ui` + `src/lib/utils.ts` (`cn()`). If eglador is chosen, import directly from `eglador-ui-react` (+ satellite packages) and keep thin local wrappers under `(frontend)/_components/ui`. Either way, keep the frontend Tailwind layer **scoped** (wrapper class / separate stylesheet) so it does not affect `(payload)`.

## Data flow

- **Branding/config (server):** the `(frontend)` root/layout reads Theme + Persona globals via the **Payload Local API** (`overrideAccess`, safe subset only — name/brandColor/logo/welcome/suggestedQuestions + which OAuth providers are `enabled`). No public REST config endpoint needed.
- **Auth guard (server):** `(chat)/layout.tsx` resolves the member from the cookie (`payload.auth({ headers })`); redirect to `/login` if absent/blocked.
- **Conversations / messages / folders / memory:** native REST with the member cookie — `GET /api/conversations?where[member][equals]=...`, `/api/messages?where[conversation]=...`, `/api/folders`, `/api/memory`. Member-scoped by `memberOwned*` access. Initial lists can be server-fetched; mutations client-side.
- **Chat:** `POST /api/assistant/chat` (SSE). `useChatStream` reads the `ReadableStream`, appends `text` deltas, then applies `citations`/`done`; supports stop (abort the fetch → server `cancel()` aborts the LLM).
- **Profile:** `PATCH /api/members/:id` (member self-edit; email/password/status locked server-side).
- **Feedback / archive / rename / move:** native `PATCH` on messages (`feedback`) / conversations (`status`, `title`, `folder`).

## Component highlights (from the product spec)

- **Sidebar:** new chat · search · "+ new folder" · collapsible folder sections + loose conversations · account block → menu (email, **Memory**, logout). Mobile = `sheet` drawer.
- **ChatWindow:** streaming token render · markdown (marked+DOMPurify) · inline source chips · message actions (copy / regenerate / 👍👎) · thinking indicator · auto-scroll + jump-to-latest · edit & resend · pill composer with animated stop.
- **MemoryPanel:** modal — list facts, delete one, clear all (`/api/memory`).
- **ConfirmDialog:** one promise-based `useConfirm()` for all destructive actions (delete chat/folder/memory).

## Build order

1. UI library + Tailwind scope setup (install eglador packages **or** init shadcn; base tokens + `--brand`).
2. Auth pages (login/register) on native member auth + `(chat)` auth guard.
3. App shell (layout + Sidebar) + empty state (welcome + suggested questions from Persona).
4. ChatWindow + `useChatStream` (SSE) + markdown + source chips + composer.
5. Conversation list/detail, rename/delete, message feedback.
6. Folders (create / move / delete) + MemoryPanel + profile screen.
7. `tr` dictionary, polish (auto-scroll, animations, dark mode), mobile drawer.

## Guardrails

- Same-origin (cookie) — the chat endpoint enforces `assertSameOrigin`; keep requests same-origin.
- Always sanitize markdown (DOMPurify); never `dangerouslySetInnerHTML` raw model output.
- No hardcoded UI strings — go through the `tr` dictionary.
- Do not touch `(payload)` / `@payloadcms/ui`; keep Tailwind scoped to the frontend.
