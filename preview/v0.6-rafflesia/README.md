# Quartzite

An IINACT / ACT overlay for FFXIV with an Apple-inspired frosted glass aesthetic.

## Features

- **Frosted glass UI** — dark and light themes, indigo accent
- **DPS · HPS · Tank modes** — switch tabs mid-pull
- **CH / DH / !!!** — crit, direct-hit, and crit-direct rates per player
- **"You" highlight** — your row shows in indigo with a custom label
- **Encounter history** — browse your last 5 pulls
- **Pet merging** — SMN/SCH pet damage rolls up to the owner
- **Name blur** — privacy mode for streaming
- **Fills window** — drag to any size in Browsingway, overlay fills it
- **Zero dependencies** — vanilla JS ES modules, no build step

## Installation (IINACT + Browsingway)

1. In IINACT, open **Browsingway Settings** → add a new overlay
2. Set the URL to:
   ```
   https://mateuspalacio.github.io/quartzite/?OVERLAY_WS=ws://127.0.0.1:10501/ws
   ```
3. Check **Locked**, **Hidden**, **Click Through**
4. Resize and position the overlay

## Installation (ACT / OverlayPlugin)

1. Open ACT → Plugins → OverlayPlugin → New overlay, type `MiniParse`
2. Set URL to `https://mateuspalacio.github.io/quartzite/`  
   or a local path: `file:///C:/path/to/quartzite/index.html`
3. Resize and position the overlay

## Cactbot raidboss skin (optional)

Paste the contents of [`cactbot-raidboss-quartzite.css`](cactbot-raidboss-quartzite.css) into  
**Browsingway → Cactbot → Custom CSS** and hit Reload.

Applies indigo timeline bars, amber "soon" state, and pill-shaped alarm/alert/info callouts.

## Settings

Open the ⚙ icon in the overlay header.

| Setting | Description |
|---|---|
| Your name | Character name to highlight (or leave blank — ACT's "YOU" is detected automatically) |
| Display as | Label shown instead of your name (default: YOU) |
| Blur names | Blurs all player names for streaming |
| Merge pets | Adds SMN/SCH pet damage to the owner's row |
| Show job icons | Shows job icons in each row |
| Max rows | How many combatants to display |
| Theme | Dark / Light |

## Development

Open `index.html` in a browser — mock combat data starts automatically after a few seconds.

```
# serve locally (any static server works)
npx serve .
# then open http://localhost:3000/quartzite/
```

## Tech stack

- Vanilla JS ES modules — no build step, no npm, no bundler
- Plain CSS with custom properties and `backdrop-filter`
- OverlayPlugin modern API (`addOverlayListener`) with WebSocket fallback
- 30-second heartbeat on the WebSocket to recover zombie connections

## License

MIT
