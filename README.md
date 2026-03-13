# DevGraph - [https://dev-graph-eight.vercel.app]

DevGraph is a full-stack developer knowledge management platform for capturing notes, code snippets, bugs, fixes, commands, architecture decisions, and learning artifacts in one searchable system. It combines structured note-taking, full-text and prefix search, tag intelligence, related-note discovery, and a visual knowledge graph so a developer can store information once and retrieve it quickly later.

The project is split into a Next.js frontend and an Express API backend backed by Supabase. The frontend focuses on a polished developer-centric experience with animated UI, searchable notes, Monaco-powered code editing, graph exploration, and a public feed. The backend handles authentication, validation, search orchestration, note storage, graph generation, tag aggregation, and security controls.

This README is intentionally deployment-safe. It documents configuration keys, architecture, and operational expectations, but it does not contain secrets, private keys, service-role credentials, or any values that should remain confidential.

## Table of Contents

1. Overview
2. Core Features
3. Product Goals
4. Tech Stack
5. Monorepo Structure
6. Frontend Pages and UX Surface
7. Shared Data Model
8. System Architecture
9. Request and Data Flow
10. Local Development
11. Environment Configuration
12. API Reference
13. Database Schema
14. Security Notes
15. Testing and Validation
16. Deployment
17. Operations Notes
18. Acknowledgements
19. Additional Notes

## Overview

DevGraph is designed as a personal developer second brain. Instead of scattering debugging notes across chat apps, browser bookmarks, markdown files, snippets, and issue comments, DevGraph keeps them in one system with explicit metadata and fast retrieval paths.

The platform supports several related workflows:

- Capture a note while solving a bug or learning a concept.
- Save a code snippet with language, category, tags, visibility, and source URL.
- Search notes with prefix-aware matching, substring fallback, and tag filters.
- Use an error matcher to compare a new error message against previously saved notes.
- Explore relationships between notes visually in a knowledge graph.
- Publish selected notes to a public feed for discovery and reuse.

The project aims to balance fast retrieval, clear organization, strong developer ergonomics, and enough security hardening to be safely deployed.

## Core Features

### 1. Developer Notes

Users can create and manage notes containing:

- Title
- Description
- Code snippet
- Language
- Tags
- Category
- Visibility
- Source URL

Supported note categories in the current implementation:

- bug-fix
- snippet
- architecture
- command
- config
- learning
- other

### 2. Monaco-Based Code Editing

The note editor uses Monaco, which provides a familiar IDE-like editing experience for stored code snippets. The editor supports syntax-highlighted snippet storage and client-side copy actions.

### 3. Intelligent Search

The search implementation combines multiple layers:

- FlexSearch in-memory prefix search for fast user-scoped lookup
- PostgreSQL full-text search against a generated TSVECTOR column
- `ilike` substring fallback for partial matches not covered by FTS

This gives better recall for real developer behavior, especially when users type incomplete terms such as `deb`, `debu`, or partial command names.

### 4. Error Matching

The error matcher compares pasted error text against previously stored notes using TF-IDF similarity. This is intended to help users find earlier bug-fix notes related to recurring error patterns.

### 5. Knowledge Graph

The graph page visualizes relationships between notes. Relations are derived from shared tags and similarity heuristics, then presented through an interactive graph visualization.

### 6. Public Feed

Users can mark notes as public and expose them in a public feed. This allows selective sharing without making the entire workspace public.

### 7. Tags and Usage Aggregation

Tags are normalized and tracked through database triggers. This enables:

- tag suggestions
- popular tag retrieval
- category and timeline insights
- better browsing and filtering

### 8. Visual and UX Layer

The frontend includes:

- animated page headings
- branded favicon and inline iconography
- a responsive sidebar and mobile navigation
- background shader and visual polish
- graph legend interactions and filters

## Product Goals

DevGraph is not just a CRUD notes app. The implementation is structured around a few concrete product goals:

- Make technical knowledge retrieval faster than searching old chats or browser history.
- Encourage structured capture through tags, category, visibility, and language.
- Turn disconnected notes into connected knowledge.
- Make private storage the default while still allowing selective public sharing.
- Keep deployment simple enough for solo developers.

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- TanStack Query
- Axios
- Monaco Editor via `@monaco-editor/react`
- Lucide React icons
- `react-force-graph-2d` for graph rendering
- `react-hot-toast` for notifications

### Backend

- Node.js
- Express 4
- Supabase JS client
- Express Validator
- Express Rate Limit
- Helmet
- CORS
- FlexSearch
- custom TF-IDF utility
- `xss-filters`

### Database and Platform

- Supabase Auth
- Supabase Postgres
- Row Level Security policies
- PostgreSQL triggers and RPC functions

### Deployment Targets

- Vercel for frontend
- Render for backend
- Docker for backend packaging on Render

## Monorepo Structure

The repository uses a simple monorepo layout with separate frontend and backend applications.

```text
DevGraph/
├─ client/                     # Next.js frontend
│  ├─ public/
│  └─ src/
│     ├─ app/                 # App Router pages and global styles
│     ├─ components/          # Reusable UI and layout components
│     ├─ context/             # Auth context
│     ├─ hooks/               # Small reusable hooks
│     └─ lib/                 # API client and constants
├─ server/                     # Express API
│  ├─ src/
│  │  ├─ config/              # env and Supabase client wiring
│  │  ├─ middleware/          # auth, rate limit, security, error handling
│  │  ├─ routes/              # API route definitions
│  │  ├─ services/            # business logic
│  │  └─ utils/               # validators, tf-idf, tag extraction
│  ├─ supabase-schema.sql     # schema, triggers, policies, RPCs
│  ├─ Dockerfile              # production container for backend
│  └─ .dockerignore
├─ extension/                  # browser extension surface
├─ render.yaml                 # Render blueprint
├─ SECURITY_AUDIT.md           # security audit findings and remediations
├─ .env.example                # safe env template
└─ package.json                # root scripts for local development
```

## Frontend Pages and UX Surface

The frontend uses Next.js App Router pages under `client/src/app`.

### Public Pages

- `/`
  - Landing page
  - Product positioning and CTA surface
  - Navigation changes depending on auth state

- `/login`
  - Sign-in flow backed by backend auth API

- `/register`
  - Account creation flow
  - Includes client-side password checks matching backend policy

### Authenticated Pages

- `/dashboard`
  - High-level overview of notes, stats, categories, and recent activity

- `/notes`
  - Notes list view
  - Search and filtering UI

- `/notes/[id]`
  - Note create/edit/detail surface
  - Monaco editor
  - metadata controls
  - related notes panel

- `/search`
  - Search interface
  - note retrieval
  - error matcher panel

- `/graph`
  - Knowledge graph visualization
  - graph generation and exploration
  - interactive category legend

- `/feed`
  - Public feed browsing

- `/tags`
  - Tag listing and discovery

- `/timeline`
  - Historical activity view

- `/snippets`
  - Snippet-centric browsing surface

- `/settings`
  - Profile and product information view

### Important Frontend Components

- `AppShell`
  - authenticated layout wrapper
  - sidebar, sticky header, page body shell

- `Sidebar`
  - desktop navigation
  - branding
  - profile/logout controls

- `MobileNav`
  - responsive mobile tab navigation

- `ConditionalBackground`
  - background visual system

- `Squares`, `ShaderBackground`, `spotlight-card`
  - decorative visual and motion layer

- `AuthContext`
  - client auth state management

- `lib/api.js`
  - Axios instance, auth token attachment, API wrappers

## Shared Data Model

Across client and server, the main note entity is shaped around the same conceptual fields:

- `id`
- `userId`
- `title`
- `description`
- `codeSnippet`
- `language`
- `tags`
- `sourceUrl`
- `visibility`
- `category`
- `createdAt`
- `updatedAt`

The backend maps database column names such as `code_snippet` and `updated_at` into frontend-friendly camelCase fields before returning them to the UI.

## System Architecture

DevGraph follows a straightforward three-layer structure:

### 1. Presentation Layer

The Next.js client handles:

- routing
- page composition
- API consumption
- local auth state
- visualizations
- optimistic UX patterns and loading states

### 2. Application Layer

The Express server handles:

- request validation
- auth enforcement
- business logic orchestration
- search indexing and matching
- rate limiting
- response shaping

### 3. Data Layer

Supabase and Postgres handle:

- user identities
- note persistence
- public/private access rules via RLS
- FTS vector generation
- tag aggregation triggers
- relation storage
- RPC functions for stats and analytics

## Request and Data Flow

### Authentication Flow

1. The frontend submits credentials to the backend auth routes.
2. The backend delegates registration/login to Supabase Auth.
3. Supabase returns a user session and access token.
4. The backend returns a normalized user object plus token.
5. The frontend stores the token in localStorage and sends it as a Bearer token on subsequent requests.
6. Protected API routes verify the token through Supabase before continuing.

### Note Creation Flow

1. User fills note form in the note editor.
2. Frontend sends note payload to `POST /api/notes`.
3. Express validates fields and auth.
4. Backend normalizes tags and inserts into `notes`.
5. Database triggers update:
   - `updated_at`
   - `fts` vector
   - tag counts
6. The server returns the created note.
7. Search index is updated in memory for that user.

### Search Flow

1. User enters a query.
2. Frontend calls `GET /api/search`.
3. Server checks auth and rate limit.
4. Search service performs:
   - FlexSearch prefix match
   - Postgres FTS prefix query
   - substring fallback with `ilike`
5. Results are merged, scored, paginated, and returned.

### Graph Flow

1. User opens graph page or triggers graph generation.
2. Backend loads the user’s notes.
3. Similarity is derived using shared tag overlap.
4. Relations are stored in `relations`.
5. Graph data is returned as nodes and edges.
6. Frontend renders the graph via `react-force-graph-2d`.

### Error Matcher Flow

1. User pastes an error string into the search page.
2. Frontend submits `POST /api/search/error-match`.
3. Backend rate-limits the request and caps input length.
4. TF-IDF similarity is computed against a subset of the user’s notes.
5. The best matches are returned and displayed.

## Local Development

### Prerequisites

- Node.js 20 or newer is recommended
- npm
- a Supabase project

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd DevGraph
```

### 2. Install Dependencies

From the repository root:

```bash
npm run install:all
```

This installs dependencies for both:

- `server/`
- `client/`

### 3. Configure Environment Variables

Copy the template values from `.env.example` into your local environment files or shell environment.

You will need at minimum:

- Supabase URL
- Supabase anon key
- Supabase service role key
- frontend API base URL
- allowed client origins for CORS

### 4. Initialize the Database

Open your Supabase SQL Editor and run:

- `server/supabase-schema.sql`

This creates:

- `profiles`
- `notes`
- `tags`
- `relations`
- triggers
- RLS policies
- helper RPC functions

### 5. Start the Applications

From the repository root:

```bash
npm run dev
```

This runs:

- backend on `http://localhost:5000`
- frontend dev server on `http://localhost:3000`

You can also run them independently:

```bash
npm run dev:server
npm run dev:client
```

### 6. Production-Style Frontend Run

The frontend is configured so production start uses a different port than dev:

- dev: `3000`
- production start: `4000`

Commands:

```bash
cd client
npm run build
npm run start
```

## Environment Configuration

The repository includes a safe template in `.env.example`.

### Backend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Express server port. Default local value is `5000`. |
| `NODE_ENV` | Yes | `development` or `production`. Affects error behavior and deployment behavior. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | Public anon key used for user-scoped Supabase client creation. |
| `SUPABASE_SERVICE_KEY` | Yes | Server-only service role key. Never expose this to the client, README examples, or version control. |
| `CLIENT_URL` | Yes | Comma-separated allowed frontend origins for CORS, for example `http://localhost:3000,http://localhost:4000`. |

### Frontend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL for the API, for example `http://localhost:5000/api` locally or your Render API URL in production. |

### Important Secrecy Rules

- Do not place `SUPABASE_SERVICE_KEY` in the frontend.
- Do not hardcode secrets into source files.
- Do not paste production keys into README examples.
- Do not commit real `.env` files.

## API Reference

All API routes are mounted under `/api`.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health/status check for the API process. |

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user through Supabase Auth. Rate-limited. |
| POST | `/api/auth/login` | No | Login and return token + normalized user object. Rate-limited. |
| GET | `/api/auth/me` | Yes | Return the current authenticated user profile. |

### Notes Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/notes` | Yes | Create a note. |
| GET | `/api/notes` | Yes | List notes with optional page, limit, tags, category, visibility, sort. |
| GET | `/api/notes/stats` | Yes | Return aggregate stats, top tags, categories, timeline, recent notes. |
| GET | `/api/notes/:id` | Yes | Get a single note by ID. |
| GET | `/api/notes/:id/related` | Yes | Get related notes for a note. Protected by ownership/visibility checks. |
| PUT | `/api/notes/:id` | Yes | Update an existing note. |
| DELETE | `/api/notes/:id` | Yes | Delete a note. |

### Search Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/search` | Yes | Search notes using combined FlexSearch and Postgres search. |
| POST | `/api/search/error-match` | Yes | Compare an error message to saved notes using TF-IDF. Rate-limited and length-capped. |
| POST | `/api/search/suggest` | Yes | Return suggestion data based on recent activity. Rate-limited. |

### Tags Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tags` | Yes | Paginated tag list. |
| GET | `/api/tags/suggest` | Yes | Suggest tags by prefix. |
| GET | `/api/tags/popular` | Yes | Return popular tags. |

### Graph Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/graph` | Yes | Return graph nodes and edges for the user. |
| POST | `/api/graph/generate` | Yes | Generate or refresh relations from user notes. |
| GET | `/api/graph/patterns` | Yes | Return category, language, and tag patterns. |

### Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/public/feed` | No | Return public notes for the feed page. |

## Database Schema

The canonical schema is defined in `server/supabase-schema.sql`.

### Tables

#### `profiles`

Extends Supabase `auth.users` with developer-facing profile data.

Key fields:

- `id` UUID primary key referencing `auth.users(id)`
- `name`
- `email`
- `created_at`

#### `notes`

The central domain table.

Key fields:

- `id`
- `user_id`
- `title`
- `description`
- `code_snippet`
- `language`
- `tags` as `TEXT[]`
- `references` as `TEXT[]`
- `source_url`
- `visibility`
- `category`
- `related_notes` as `UUID[]`
- `fts` as `TSVECTOR`
- `created_at`
- `updated_at`

Important constraints:

- title length check
- visibility enum-style check
- category enum-style check

Important indexes:

- user-scoped note indexes
- tags GIN index
- category index
- FTS GIN index

#### `tags`

Aggregated tag usage table maintained by trigger logic.

Key fields:

- `id`
- `name`
- `usage_count`
- `created_at`

#### `relations`

Stores edges between notes.

Key fields:

- `id`
- `source_id`
- `target_id`
- `relation_type`
- `weight`
- `created_at`

Unique constraint:

- `(source_id, target_id)`

### Triggers and Functions

The schema contains important database automation:

- `handle_new_user`
  - creates a profile row on signup

- `update_updated_at`
  - keeps `updated_at` fresh on updates

- `update_notes_fts`
  - maintains the `fts` column for full-text search

- `sync_tag_counts`
  - updates the `tags` table after note insert/update/delete

### RPC Functions

- `get_user_category_counts(uid)`
- `get_user_tag_counts(uid, lim)`
- `get_user_timeline(uid)`

These are used by the dashboard/statistics flows.

### Row Level Security

The schema enables RLS on:

- `profiles`
- `notes`
- `tags`
- `relations`

Current policies enforce:

- a user can read/update only their own profile
- a user can manage only their own notes
- public notes can be read outside ownership checks where allowed
- authenticated users can read tags and relations

## Security Notes

The repository includes a dedicated security report in `SECURITY_AUDIT.md`.

Security work already present in the current codebase includes:

- Helmet security headers
- explicit CORS allowlist via `CLIENT_URL`
- global API rate limiting
- dedicated login/register/search rate limiting
- request validation with Express Validator
- 1 MB body-size cap
- user token verification through Supabase Auth
- UUID validation for note IDs
- XSS sanitization for non-code text input
- protection against IDOR on related-note retrieval
- bounded pagination limits to reduce abuse and data-dump risk

### Important Security Implementation Notes

- The backend uses the Supabase service role key server-side only.
- The frontend should never receive the service role key.
- JWTs are currently stored in localStorage on the client.
- This is acceptable for the current architecture, but if the threat model becomes stricter, migrating to secure HttpOnly cookies is worth evaluating.

### What This README Intentionally Does Not Include

To keep deployment safe, this file does not expose:

- real environment values
- real project URLs unless you choose to add your public deployment URLs later
- database passwords or private keys
- service-role credentials
- internal-only operational tokens

## Testing and Validation

### Backend

Backend package scripts:

```bash
cd server
npm run dev
npm run start
npm run test
```

### Frontend

Frontend package scripts:

```bash
cd client
npm run dev
npm run build
npm run start
npm run lint
```

### Root Scripts

From the repository root:

```bash
npm run install:all
npm run dev
```

## Deployment

The project is currently structured for:

- frontend on Vercel
- backend on Render
- backend containerized with Docker

### Backend Deployment on Render

The repository includes:

- `server/Dockerfile`
- `server/.dockerignore`
- `render.yaml`

The current `render.yaml` defines a Docker-based Render web service named `devgraph-api`.

High-level steps:

1. Push the repository to GitHub.
2. Create a new Render Web Service or Blueprint.
3. Point Render to the repository.
4. Use the backend Dockerfile under `server/`.
5. Configure environment variables in Render:
   - `PORT`
   - `NODE_ENV=production`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `CLIENT_URL`
6. Deploy and note the public Render URL.

If your hosting tier idles inactive services, you can use UptimeRobot to send periodic HTTP checks to the backend health endpoint so the API stays warm for smoother public access. In this project, that monitor target is:

```text
https://your-render-service.onrender.com/api/health
```

### Frontend Deployment on Vercel

High-level steps:

1. Import the repository into Vercel.
2. Set the root directory to `client`.
3. Add `NEXT_PUBLIC_API_URL` pointing to the Render backend, for example:

```text
https://your-render-service.onrender.com/api
```

4. Deploy the app.
5. Update the backend `CLIENT_URL` on Render to match your Vercel domain.

### Production Environment Mapping

Typical production mapping looks like this:

- frontend: `https://your-frontend.vercel.app`
- backend: `https://your-backend.onrender.com`
- `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
- `CLIENT_URL=https://your-frontend.vercel.app`

### Deployment Safety Checklist

Before going live, verify all of the following:

- No real secrets are committed.
- `SUPABASE_SERVICE_KEY` exists only in backend/server environment.
- `NEXT_PUBLIC_API_URL` points to the correct production API URL.
- `CLIENT_URL` exactly matches your frontend origin.
- RLS policies are enabled in Supabase.
- `NODE_ENV=production` is set on the server.
- The backend health route returns healthy status.

## Operations Notes

### Ports

Local defaults in the current setup:

- backend API: `5000`
- frontend dev: `3000`
- frontend production start: `4000`

### Search Index Behavior

FlexSearch is built in memory per user session on the backend. If the process restarts, the in-memory index is rebuilt on demand the next time a user searches.

### Public Data Model Expectations

Only notes marked as `public` should appear in the public feed. Private note access remains gated through backend auth and visibility checks.

### Uptime Monitoring

For seamless deployment behavior on hosts that may sleep after inactivity, configure UptimeRobot to ping the backend health route on a regular interval. The current health endpoint is `/api/health`, which makes it a suitable lightweight target for availability checks.

## Acknowledgements

This project stands on top of several solid open-source tools and hosted services:

- Next.js
- React
- Supabase
- Express
- Monaco Editor
- Tailwind CSS
- TanStack Query
- FlexSearch
- Vercel
- Render
- UptimeRobot

## Additional Notes

### Browser Extension Folder

The repository also contains an `extension/` directory. That surface is separate from the core web application and backend but can be used to extend the DevGraph experience in the browser.

### Client README

There is also a `client/README.md`, but this root README is intended to be the primary project document for the deployed product and the full stack.

### Recommended Future Improvements

Potential next steps if you keep expanding the project:

- add automated integration tests for the API routes
- add end-to-end tests for auth, note creation, search, and graph flows
- migrate auth tokens from localStorage to HttpOnly cookies if your threat model requires it
- add observability and request logging
- add database backups and operational runbooks
- add API versioning if public API consumers appear later

---

If you deploy this project publicly, keep this file descriptive but continue treating all real environment values and privileged credentials as secrets. This README is meant to help users, contributors, reviewers, and deployers understand the system without exposing sensitive operational data. Peace out ✌️

---

                      Made with 💖 by Ywatch15.