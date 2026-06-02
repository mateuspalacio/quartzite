# Quartzite

An ACT Overlay Plugin skin for FFXIV with an Apple-inspired frosted glass aesthetic.

![Dark mode](preview-dark.png)

## Features

- **Frosted glass UI** — `backdrop-filter` blur with adaptive dark/light themes
- **DPS · HPS · Tank modes** — switch tabs mid-pull
- **Encounter history** — browse your last 5 pulls
- **Pet merging** — SMN/SCH pet damage rolls up to owner
- **Name blur** — privacy mode for streaming
- **Zero dependencies** — vanilla JS ES modules, no build step

## Installation (ACT)

1. Open ACT → Plugins → OverlayPlugin → New overlay
2. Set **Type** to `MiniParse`
3. Set **URL** to the GitHub Pages URL:  
   `https://<your-username>.github.io/quartzite/`  
   _or_ use a local path: `file:///C:/path/to/quartzite/index.html`
4. Resize and position the overlay window

## Installation (OBS browser source)

Use the GitHub Pages URL with the WebSocket parameter:

```
https://<your-username>.github.io/quartzite/?OVERLAY_WS=ws://127.0.0.1:10501/ws
```

## Development

Open `index.html` directly in Chrome — mock combat data starts automatically after a few seconds.

## Tech stack

- Vanilla JS (ES6 modules)
- Plain CSS with custom properties + `backdrop-filter`
- OverlayPlugin modern API (`addOverlayListener`) with legacy WebSocket fallback
- No build step, no npm, no bundler

## License

MIT
