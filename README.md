# Mother OS — Personal Life Operating System

Pete's personal command centre. One screen, one tone of voice, nothing slipping.

> **Status: Phase 0 complete** — skeleton UI, Kanban board, SQLite persistence, drag-and-drop, keyboard shortcuts.

---

## Open in StackBlitz

Once pushed to GitHub, open instantly with:

```
https://stackblitz.com/github/peternsmith85-dev/mother-os
```

StackBlitz will auto-install dependencies and run `pnpm dev`.

Add your `ANTHROPIC_API_KEY` in the StackBlitz environment variables panel (left sidebar → env vars) — it maps to the `.env` file.

---

## Local setup

```bash
git clone https://github.com/peternsmith85-dev/mother-os
cd mother-os
pnpm install
cp .env.example .env
# Fill ANTHROPIC_API_KEY and other keys in .env
pnpm prisma db push   # creates data/mother.db
pnpm dev              # http://localhost:4789
```

---

## Phase progress

| Phase | Status | Description |
|-------|--------|-------------|
| 0 — Skeleton | ✅ **Done** | Layout, Kanban, SQLite, dnd, keyboard nav |
| 1 — Mother + Brief + Email | ⏳ Next | Agent, morning brief, Gmail ingest |
| 2 — Calendar + Wellbeing + Lara | 🔜 | Gym nudges, coffee, Lara reminders |
| 3 — Transcripts + Band/Gigs | 🔜 | Otter ingest, band widget |
| 4 — Music + Quotes | 🔜 | Last.fm recs, mood quotes |
| 5 — Email Drafting | 🔜 | Draft button, Gmail Drafts |
| 6 — Bank + Polish | 🔜 | GoCardless, mobile PWA |

---

## Phase 0 — keyboard shortcuts

| Key | Action |
|-----|--------|
| `J` / `↓` | Next card |
| `K` / `↑` | Previous card |
| `Enter` | Open/close card detail |
| `D` | Mark done |
| `B` | Block |
| `E` | Draft email (Phase 5) |
| `Esc` | Close detail / deselect |
| `/` | Focus Mother chat |

---

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + custom Fellten palette
- **Prisma + libSQL** (WASM SQLite — StackBlitz compatible)
- **dnd-kit** for drag-and-drop
- **TanStack Query** + Zustand
- **Anthropic Claude SDK** (Phase 1+)
- **node-cron** for scheduled workers (Phase 1+, replaces BullMQ/Redis)

---

## Questions to answer before Phase 2 (PRD §19)

1. Gym venue for lower/upper days (not Bloc)?
2. Lara nudge cadence — 24h or 36h?
3. Coffee slots — 09:30 / 13:30 / 16:00 OK?
4. Stress thresholds — 0.6 / 0.8 / 0.95 OK?
5. Lara anniversary/birthday dates (local only)?
6. Bank budget categories — confirm amounts?
7. Quote frequency — up to 3/day OK?
8. Gigs — Bandsintown/Songkick or always manual?
9. Pushover or desktop-only notifications?
10. Mike 1:1 prep sheet 24h before — yes?
