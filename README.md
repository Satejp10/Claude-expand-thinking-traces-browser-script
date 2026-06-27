# Claude.ai — Expand All Thinking Traces

Demo.gif

A lightweight userscript that adds a floating **Expand all** button to [claude.ai](https://claude.ai). One click expands every collapsed thinking trace, tool call, "Show more" block, capped code panel, and truncated timeline section in the current conversation — so you can read or `Ctrl+F` a whole chat without clicking each toggle.

Hover the button for **1 second** to open a menu with granular controls.

![Version](https://img.shields.io/badge/version-1.2.1-7F4BF3) ![Userscript](https://img.shields.io/badge/userscript-Tampermonkey-success) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) (recommended), Violentmonkey, or Greasemonkey.
2. Click the raw script link to install:
   **[`claude-expand-all.user.js`](https://raw.githubusercontent.com/Satejp10/claude-expand-all/main/claude-expand-all.user.js)**
3. Tampermonkey detects the `.user.js` file and shows an install prompt — confirm it.
4. Open or refresh a [claude.ai](https://claude.ai) chat. A pill appears in the bottom-right corner.

Auto-updates are wired via `@updateURL` (checks the `main` branch), so installs from the raw link stay current.

> Alternative: copy the file contents into a new Tampermonkey script (Dashboard → **+** → paste → save).

---

## What it does

The main pill button runs every expander in sequence. Hover 1s to pick one:

| Menu action | What it expands |
|---|---|
| **Thinking traces** | Collapsed extended-thinking blocks |
| **Tool calls & outputs** | Collapsed tool/function call rows and their results |
| **"Show more" text** | Long messages truncated behind a *Show more* link |
| **Uncap timeline height** | Removes height caps + fade gradients on long timeline text |
| **Code / script panels** | Removes the `max-height` scroll cap on code blocks so the full script is visible |
| **Collapse all thinking** | Reverses — re-collapses every expanded thinking block |

Other behavior:

- **Live badge** — the number on the pill shows how many collapsed items remain on the page (refreshes on scroll/new content).
- **Draggable** — drag the pill anywhere; its position is saved to `localStorage` and restored next visit.
- **Theme-aware** — reads Claude's design tokens and matches light/dark mode automatically, with sensible fallbacks if tokens load late.
- **Artifact-safe** — deliberately skips artifact panels so it won't touch open artifacts or their controls.
- **Toast feedback** — a small toast reports what was expanded (e.g. *Expanded: 4 thinking, 2 tools*).

---

## Repository

```
claude-expand-all/
├── claude-expand-all.user.js   # the userscript
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

---

## Notes & limitations

- Selectors are tuned to Claude's current DOM (`group/status`, `group/row`, `.font-claude-response`, `[data-timeline-text]`, etc.). If Anthropic ships a UI change, an action may stop firing until the relevant selector is updated — open an issue if you spot one.
- `@grant none` — no special permissions; everything runs in the page context.
- Matches `https://claude.ai/*` and `https://*.claude.ai/*` only.

## Contributing

Issues and PRs welcome. When reporting a broken expander, note which menu action failed and (if you can) the element it should have clicked.

## License

[MIT](LICENSE) © Satej Patil
