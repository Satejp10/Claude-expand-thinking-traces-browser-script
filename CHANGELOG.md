# Changelog

All notable changes to this userscript are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/); versioning matches the `@version` tag in the script header.

## [1.2.1] — initial public release

Floating **Expand all** pill for claude.ai with a hover-revealed menu.

- **Expand all** (main button): runs every expander in sequence — thinking traces, tool calls, "Show more" text, timeline-height uncap, and code panels.
- **Granular menu** (hover 1s): each expander individually, plus **Collapse all thinking**.
- **Live badge** showing the count of collapsed items remaining on the page, refreshed on DOM changes and on an interval.
- **Draggable** pill with position persisted to `localStorage`.
- **Theme sync** with Claude's design tokens (light/dark) and fallback palette when tokens aren't ready yet.
- **Artifact-safe** guards so artifact panels are never clicked or altered.
- **Toast** feedback summarizing what was expanded.

[1.2.1]: https://github.com/Satejp10/claude-expand-all/releases
