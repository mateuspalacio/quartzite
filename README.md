# Quartzite

A frosted glass ACT / IINACT overlay for FFXIV — clean DPS meter with multiple appearance themes.

## Features

- **Frosted glass UI** — Dynamis Crystal, Corgi, and Alexandrian themes
- **Dark / Light** — per-theme colour modes
- **DPS · HPS · Tank modes** — switch mid-pull
- **CH / DH / !!!** — crit, direct-hit, and crit-direct rates per player
- **"You" highlight** — your row shows in accent colour with a custom label
- **Encounter history** — browse your last 5 pulls
- **Pet merging** — SMN/SCH pet damage rolls up to the owner
- **Name options** — first name only, full name, caps, blur (for streaming)
- **Font size** — S / M / L / XL to fit any monitor
- **Fills window** — drag to any size, overlay fills it
- **Zero dependencies** — vanilla JS, no build step

## Installation (ACT / OverlayPlugin)

1. Open ACT → Plugins → OverlayPlugin → New overlay, type `MiniParse`
2. Set URL to `https://mateuspalacio.github.io/quartzite/`
3. Resize and position the overlay

No WebSocket server configuration needed — works out of the box.

## Installation (IINACT + Browsingway)

1. In IINACT, open **Browsingway Settings** → add a new overlay
2. Set the URL to:
   ```
   https://mateuspalacio.github.io/quartzite/?OVERLAY_WS=ws://127.0.0.1:10501/ws
   ```
3. Resize and position the overlay

## Local testing

Open `file:///path/to/quartzite/index.html` directly in a browser — no server needed.  
To use live ACT data locally, add `?OVERLAY_WS=ws://127.0.0.1:10501/ws` to the URL.

## Cactbot raidboss skin (optional)

Paste the contents of [`cactbot-raidboss-quartzite.css`](cactbot-raidboss-quartzite.css) into  
**Browsingway → Cactbot → Custom CSS** and hit Reload.

Applies indigo timeline bars, amber "soon" state, and pill-shaped callouts.

## Settings

Open the ⚙ icon in the overlay header.

| Setting | Description |
|---|---|
| Your name | Character name to highlight (ACT's "YOU" is detected automatically) |
| Display as | Label shown instead of your name (default: YOU) |
| Full names | Show full "Firstname Lastname" instead of first name only |
| Caps names | Display names in small-caps style |
| Blur names | Blurs all player names for streaming |
| Merge pets | Adds SMN/SCH pet damage to the owner's row |
| Show job icons | Shows job icons in each row |
| Players shown | How many combatants to display (8 / 12 / 16 / 24 / 32 / All) |
| Font size | S / M / L / XL |
| Theme | Dark / Light |
| Appearance | Dynamis Crystal / Corgi / Alexandrian |
| Show mascot | Toggle the corner mascot image |

## Tech stack

- Vanilla JS — no build step, no npm, no bundler
- Plain CSS with custom properties and `backdrop-filter`
- ACT legacy DOM events (`onOverlayDataUpdate`) + modern `addOverlayListener` + WebSocket fallback
- 30-second heartbeat on WebSocket to recover zombie connections

## License

MIT
