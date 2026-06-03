# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Quartzite is a vanilla ES-module web overlay for Final Fantasy XIV, designed to run inside ACT (Advanced Combat Tracker) or IINACT via OverlayPlugin. It has no build step — all files are served as-is from GitHub Pages at `https://mateuspalacio.github.io/quartzite/`.

**Never introduce a build system, bundler, or npm dependencies.** The entire app is plain HTML + CSS + ES modules.

## Development

Open `index.html` directly in a browser, or serve the folder with any static file server. To see live data without ACT, temporarily uncomment `connectMock()` in `js/act.js` (see the comment in the `init()` function). Remember to re-comment it before committing.

There are no tests, no linter config, and no CI beyond GitHub Pages auto-deploy on push to `master`.

## Architecture

The app is a single-page overlay with no framework. Entry point is `index.html` → `js/main.js` (ES module).

### Data flow

```
ACT / IINACT
  └── js/act.js          Detects connection method, emits CombatData / ChangeZone
        └── js/main.js   Handles events, renders DOM, manages state
```

`act.js` tries three connection strategies in order:
1. `window.addOverlayListener` — modern OverlayPlugin API (polled every 50ms for up to 2s)
2. WebSocket via `OVERLAY_WS` / `HOST_PORT` URL params
3. WebSocket fallback to `ws://127.0.0.1:10501/ws`

### Key files

| File | Purpose |
|---|---|
| `js/main.js` | All rendering logic, settings wiring, encounter state, history |
| `js/act.js` | ACT connection layer (modern API + WebSocket + heartbeat) |
| `js/config.js` | `localStorage`-backed settings, DEFAULTS object |
| `js/history.js` | In-memory ring buffer of last 5 completed encounters |
| `js/jobicons.js` | Maps job abbreviation → CSS `background-position` in `icons/classes.png` |
| `js/format.js` | `fmtDps`, `fmtPct`, `firstName`, `jobAbbr` |
| `css/main.css` | All layout, theming (CSS custom properties), animations |
| `css/jobs.css` | Per-job `--job-color` CSS variables (used for bar gradient) |
| `icons/classes.png` | Kagerou sprite sheet — 11×6 grid, `background-size: 1100% 600%` |

### Rendering model

`renderCombatants()` uses a **keyed update** pattern: rows are never moved in the DOM; `style.order` is changed instead to avoid replaying the entry animation. New combatants get `buildRow()` + `appendChild`. Removed combatants are `.remove()`d. Bar widths animate via a CSS custom property `--bar-pct` with a spring `cubic-bezier`.

The live timer between ACT ticks (1 Hz) is driven by a `requestAnimationFrame` loop in `main.js` that extrapolates from `timerBase + (performance.now() - timerTickAt)`.

### Encounter detection

A new encounter is flagged when `CurrentZoneName` changes OR `DURATION` goes backwards (same logic as Kagerou). `ChangeZone` events also reset the display immediately.

### Combatant filtering

Only players with a job in the `PLAYER_JOBS` set AND `damage > 0 || healed > 0` are shown. This filters out bosses, NPCs, and idle ACT entries.

### Browsingway compatibility notes

- No `box-shadow` on `.app` — it renders as a visible rectangle in Browsingway's CEF renderer.
- `backdrop-filter` works but may be limited; test visually.
- `body.locked` is **not** injected by Browsingway — do not rely on it.

## Versioning

**Current version: v0.5 "Twintania" (beta)**

The version is displayed in the Settings panel (`index.html`) and in the empty-state changelog (`js/main.js` → `CHANGELOG`).

**When making any notable change, always ask the user: "Should I add a changelog entry for vX.X?"** before committing. The changelog is defined in `js/main.js` as the `CHANGELOG` array and rendered in the empty state when no encounter is active.

### Changelog format

```js
{ version: 'v0.5', date: 'YYYY-MM-DD', notes: ['Short note', 'Another note'] }
```

Entries are shown newest-first. Keep notes short (one line each).
