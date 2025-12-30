## 1. Updated Product Vision

> A web-first, extensible journaling and knowledge system
> Designed for daily praxis, reflection, and domain-specific analysis,
> where Markdown documents are the primary medium,
> and domain plugins (e.g. Chess) introduce rich, embeddable cards and metadata.

### Key metaphors

* Page = a Markdown document (journal entry, game page, overview)
* Card = an atomic, embeddable entity (game, position, annotation, task, etc.)
* Plugin = a domain extension that:
  * defines new card types
  * defines new metadata
  * optionally owns external data (e.g. PGN files)
* Portal = an embedded view of a card or query that always links back to its source

Chess is the flagship plugin, but the system is intentionally not chess-specific.

---

## 2. High-level architecture

Web-first, API-centric


┌──────────────┐
│ Web / Mobile │  React (web, tablet, phone)
│ UI Clients   │  React Native (later)
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ Application API (TS)    │
│ - Pages                 │
│ - Cards                 │
│ - Plugins               │
│ - Queries               │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ SQLite Persistence      │
│ - Core tables           │
│ - Plugin tables         │
└─────────────────────────┘


* Same API used by:
  * Web app
  * Tauri desktop app
  * React Native mobile app
* Offline-first can be layered in later (SQLite already supports this)

---

## 3. Core system requirements (revised)

###3.1 Pages & Markdown documents

* Pages are Markdown documents
* Support:
 * Free-form writing
 * Headings, lists, links
 * Embedded cards
 * Embedded queries
* Pages are hierarchical:
  * Parent / child pages (Notion-like)
* Special page types:
  * Daily journal (auto-created per date)
  * Plugin-defined pages (e.g. Tournament overview)

#### Storage

* Markdown stored as files or blobs
* Metadata stored in SQLite

---

## 3.2 Cards (first-class, plugin-extensible)

A card is:

* An entity with:
  * stable ID
  * type (namespaced, e.g. chess.game)
  * owning plugin
* Renderable in multiple views:
  * compact
  * full
  * embedded

Cards:
* Can be embedded in Markdown pages
* Can appear in queries and dashboards
* Always act as portals back to their source page/entity

---

## 3.3 Embedding & block syntax

Markdown extension (conceptual):

```
{{embed chess:game id="corr-2025-017" view="compact"}}

{{query chess:annotations where theme="minority-attack"}}
```

* Core parses embed/query blocks
* Dispatches rendering to plugin
* Plugin returns a component (HTML/React)

---

## 3.4 Taxonomy & metadata (core)

Global, plugin-agnostic:

* Tags
* Categories / taxonomies
* Arbitrary key-value metadata
* Applies to:
  * Pages
  * Cards
  * Plugin entities

This enables:
* Filtering
* Timelines
* Cross-domain dashboards

---

## 4. Plugin system (revised)

Plugins are first-class citizens, not add-ons.

### Plugin responsibilities

A plugin may:

* Define new entity types
* Define new card types
* Define database tables (namespaced)
* Define Markdown embeds
* Define page templates
* Define dashboards
* Define background processors (e.g. PGN parsing)

Plugin isolation rule

* Core never directly queries plugin tables
* Plugins expose query interfaces to the core

This keeps:
* Core generic
* Plugins swappable
* Data ownership clear

---

## 5. Chess plugin (revised, TypeScript-first)

### 5.1 Chess data sources

* External PGN files (authoritative move history)
* PGN parsing via TypeScript chess library (e.g. chess.ts)
* SQLite stores:
  * metadata
  * annotations
  * derived data (cached FENs, evals)

---

## 5.2 Chess entities

### Chess game

* One game = one page
* References:
  * PGN file path
  * Game ID (preferred)
* Metadata:
  * players
  * event
  * date
  * tournament

### Chess annotation

* Tied to:
  * game ID
  * move number or FEN
* Atomic
* Embeddable
* Taggable

---

## 5.3 Chess cards

Plugin defines:

* Game card
  * current position
  * players
  * last move
  * evaluation
* Position card
  * board
  * notes
  * move context
* Annotation card
  * position + commentary

### Boards:
  * Static SVG (fast)
  * Interactive (Chessground) when needed

---

## 6. Database architecture (multi-tenant aware)

### 6.1 Core tables

All tables are tenant-scoped.

```
tenants
- id
- name

pages
- id
- tenant_id
- title
- parent_id
- markdown_path
- created_at
- updated_at

cards
- id
- tenant_id
- plugin
- type
- source_ref

tags
page_tags
metadata
```

---

## 6.2 Plugin-namespaced tables (Chess)

Example prefix: chess_

```
chess_games
- id
- tenant_id
- page_id
- pgn_file
- game_id
- white
- black
- date

chess_annotations
- id
- tenant_id
- game_id
- move_number
- fen
- content
```

* Each tenant:
  * has its own chess data
  * May enable/disable plugins independently

---

## 7. Multi-tenancy model

### Initial assumption

* One SQLite database per tenant (simplest, safest)

### Later options

* Shared DB with tenant_id (more complex, but more efficient)
* Server-hosted multi-tenant service

### Plugins:

* Installed per tenant
* Versioned per tenant
* Can ship with defaults

---

## 8. Tech stack (revised)

### Core stack


* Language:	TypeScript (everywhere)
* Backend API:	Node.js (Fastify)
* Database:	SQLite
* Query:	SQL + typed query layer
* Editor:	ProseMirror / MDX
* Frontend:	React
* Styling:	Tailwind / CSS vars
* State:	Local-first friendly


### Clients

* Web:	Primary
* Tablet / Phone:	Responsive web first
* Desktop:	Tauri (later)
* Mobile app:	React Native (API-compatible)


### Chess plugin stack

* Concern:	Tool
* PGN parsing:	chess.ts
* Board:	Chessground
* Static boards:	SVG (FEN → SVG)
* Analysis:	optional UCI engine

---

## 9. Evolution strategy

### Phase 1 – Web MVP

* Pages
* Markdown editor
* Embeds
* Chess plugin (read-only PGN + annotations)

### Phase 2 – Daily journal & dashboards

* Auto daily pages
* Queries
* Timelines

### Phase 3 – Offline & native

* Tauri desktop
* Local file system access
* PGN file watching

### Phase 4 – Mobile

* React Native
* Offline sync


---

## 10. Final synthesis

You’re defining:

> A plugin-driven, Markdown-first, local-friendly journaling system
> where Chess is a deep domain plugin, not a bolt-on feature,
> and where pages, cards, and portals let you move fluidly between:
> * daily practice
> * tournament tracking
> * long-term reflection


This is not just “Notion for chess” —
it’s a general knowledge system with chess as a proving ground.

