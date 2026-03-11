# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start frontend dev server at http://localhost:3000 (auto-opens browser)
npm run build     # Build production bundle to ./build/
```

The backend API server (if present) runs separately on port 4000. No test or lint scripts are configured.

## Architecture

This is a single-page React 18 + TypeScript game built with Vite. All game logic and UI lives in `src/App.tsx`.

**Game flow:** Three treasure chests are displayed; one randomly contains treasure. Clicking a chest reveals treasure (+$100) or a skeleton (-$50). The game ends when treasure is found or all boxes are opened.

**State shape** (`src/App.tsx`):
- `boxes: Box[]` — array of 3 `{ id, isOpen, hasTreasure }` objects, randomized each round
- `score: number` — cumulative score per round
- `gameEnded: boolean` — triggers game-over UI
- `user / token / isGuest` — auth state; token persisted to `localStorage`
- `leaderboard: LeaderboardEntry[]` — top scores fetched from backend on game end

**Auth & backend** (`src/api.ts`):
- REST API at `http://localhost:4000` with endpoints: `POST /api/register`, `POST /api/login`, `POST /api/scores` (JWT Bearer), `GET /api/scores`
- Users can play as guest (no score saved) or log in to persist scores to the leaderboard
- Auth token/email stored in `localStorage`; restored on page load

**Key implementation details:**
- Chest open/close animation uses Framer Motion (`motion/react`) with `rotateY` 3D flip
- Audio: `chest_open.mp3` plays on treasure find; `chest_open_with_evil_laugh.mp3` plays on skeleton
- Custom key cursor (`src/assets/key.png`) shown on hover over closed chests via inline `style`
- `src/components/figma/ImageWithFallback.tsx` — utility for rendering images with SVG fallback

**UI components:** `src/components/ui/` contains 60+ shadcn/ui components (Radix UI based). Currently used: `Button`, `Dialog`, `Input`, `Table`. Add new UI from this library before creating custom components.

**Styling:** Tailwind CSS v4.1.3 via `src/index.css`. Theme tokens are in `src/styles/globals.css` as CSS custom properties.

**Path alias:** `@` maps to `src/` (configured in `vite.config.ts`).

**Assets available:**
- `src/assets/treasure_closed.png`, `treasure_opened.png`, `treasure_opened_skeleton.png` — chest states
- `src/assets/key.png` — key cursor icon
- `src/audios/chest_open.mp3`, `chest_open_with_evil_laugh.mp3` — sound effects
