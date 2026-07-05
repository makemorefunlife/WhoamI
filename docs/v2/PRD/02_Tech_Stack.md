# 02_Tech_Stack.md

# Technology Stack

Version: MVP v1

---

## Purpose

Stack choices for MVP. Architecture behavior → [01_AI_Architecture.md](01_AI_Architecture.md).

---

## Technology Principles

- Fast MVP delivery · Low infra cost · AI-native
- Scalable enough for paid reports · Maintainable by small team
- Prefer managed services over custom ops

---

## Frontend Stack

| Tech | Role |
|------|------|
| **Next.js** | App framework (App Router, SSR/SEO) |
| **React** | UI components |
| **TypeScript** | Type safety |
| **TailwindCSS** | Styling / design system |

Hosting target: **Vercel** (CDN, deploy UX).

---

## Backend / Database

| Tech | Role |
|------|------|
| **Supabase** (primary) | Auth helpers, Postgres, storage, edge functions, realtime |
| **PostgreSQL** | Users, profiles, reports, relationships, journal, AI outputs |

**Future candidate:** Firebase — evaluate if mobile/offline needs diverge.

---

## Hosting

- **Vercel** — Next.js app, previews, edge
- **Supabase cloud** — database & backend services

---

## Authentication

- **Clerk** (planned) — Google, Apple, email; user management

---

## Payment

### Primary candidate

**Lemon Squeezy**

### Alternatives

- Paddle
- Polar

### Selection criteria

- Merchant of Record support
- Subscription support
- Global tax handling
- API / webhook integration
- Korean business compatibility
- Refund and cancellation management

Finalize before production launch.

---

## AI Models

| Role | Provider |
|------|----------|
| Primary | **OpenAI GPT** — narrative, reasoning, coaching |
| Secondary | **Google Gemini** — cost / quality experiments |

Runtime dev: `OPENAI_API_KEY` in `env.local`; model slug in `runtime/lib/llm.js`.

---

## Saju Calculation Engine

**Library (candidate):** `@fullstackfamily/manseryeok`

Provides: calendar conversion, four pillars, hidden stems, ten gods, five elements.

Maps to Human Framework via `docs/saju/04_*` — not in LLM.

---

## Development Tools

| Tool | Use |
|------|-----|
| **Cursor** | Primary IDE + agents |
| **Claude Code** | Review, generation |
| **Notion** | Optional external notes |
| **Figma** | UI/UX |
| **Playwright** | E2E (post-MVP hardening) |

---

## Domain

**Namecheap** — viable registrar candidate; no change required for MVP.

---

## Future Candidates

| Area | Options |
|------|---------|
| Mobile | Expo, React Native |
| Backend alt | Firebase |
| Payment alt | Paddle, Polar (see criteria above) |

---

## Selection Philosophy

Choose for **reliability, simplicity, AI workflow fit, cost, scale** — not hype.  
Stack may evolve; product SSOT and pipeline rules stay in `docs/PRD` + `docs/guide/10`.
