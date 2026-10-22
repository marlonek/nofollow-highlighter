# Nofollow Highlighter – SEO link marker

A Chrome extension (Manifest V3) that highlights links on any page by their `rel`
attribute, for quick SEO review: **dofollow**, **nofollow**, **sponsored** and **ugc**.

Runs 100% locally — it only reads the page DOM. No network requests, no tracking,
no remote code.

## Install

- **Chrome Web Store** — [Nofollow Highlighter – SEO link marker](https://chromewebstore.google.com/detail/nofollow-highlighter-%E2%80%93-se/hhbnomceeblphgehegfloillgmegokgf)
- **Microsoft Edge Add-ons** — [listing](https://microsoftedge.microsoft.com/addons/detail/nofollow-highlighter-%E2%80%93-se/ildcccibmgjclacjdkffhnddnjdddiab)
- **Firefox (AMO)** — [listing](https://addons.mozilla.org/addon/nofollow-highlighter/)
- **Opera Add-ons** — pending moderation

Works on Brave and Vivaldi via the Chrome Web Store listing.

## How links are classified

| Type | `rel` | Color |
|------|-------|-------|
| dofollow | no `nofollow`/`sponsored`/`ugc` | 🟢 green |
| nofollow | `nofollow` | 🔴 red |
| sponsored | `sponsored` | 🟠 orange |
| ugc | `ugc` | 🔵 blue |

A link with several values (e.g. `rel="sponsored nofollow"`) is classified by priority:
`sponsored` → `ugc` → `nofollow`. Hovering a link shows the full `rel` value and whether
it is internal or external.

Only real `http(s)` links are marked — `#`, `mailto:`, `tel:` and `javascript:` are skipped.

## Controls (popup)

- **Highlighting enabled** — master on/off switch for the whole extension.
- **Active on this site** — turn marking off for the current domain only (kept in a
  per-site exclusion list). Re-enable any time from the popup.
- **Link types to highlight** — checkboxes to pick which types are shown (e.g. only
  nofollow, or nofollow + ugc). Doubles as the color legend.
- **External links only** — highlight only links pointing to a different domain.
- **Marking style**:
  - **Underline (B)** – colored underline under the link (default)
  - **Badge (A)** – small colored label with the type next to the link
  - **Underline + badge (C)**

Changes apply to open tabs instantly — no reload needed.

The toolbar icon also shows a badge with the number of non-dofollow links
(nofollow + sponsored + ugc) detected on the current page.

## Permissions and privacy

- `storage` — saves settings locally (enabled, style, visible types, excluded sites).
- `host_permissions: http://*/* https://*/*` — required to read and highlight links on
  the pages you visit (least privilege; `ftp:` and other schemes are excluded). No data
  ever leaves the browser.
- No telemetry, no remote code (per MV3).

## Install (developer mode)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the folder containing this `manifest.json`.
4. To test the local `test.html`, also enable **Allow access to file URLs** in the
   extension's details (Chrome blocks file access for extensions by default).

## Project structure

```
manifest.json          — MV3 configuration
src/background.js       — service worker (default settings on install)
src/content.js          — link scanning + marking + MutationObserver
src/highlighter.css     — visual layer (colors, styles)
src/popup.html/.css/.js — settings hub: switches, type checkboxes, style
icons/                  — icons 16/32/48/128
test.html               — local test page with all link types
CHANGELOG.md            — version history (SemVer)
```

## Builds

- **Chromium** (Chrome, Edge, Opera, Brave, Vivaldi): uses `manifest.json`.
- **Firefox** (AMO): uses `manifest.firefox.json` (event-page background + Gecko settings).
  The scripts alias `globalThis.browser || globalThis.chrome`, so one codebase runs on both
  engines.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). The `version` field
in `manifest.json` and the top entry in `CHANGELOG.md` must always match.

## Links

- Landing page: [melioo.com/nofollow-highlighter](https://melioo.com/nofollow-highlighter)
- Author site: [bartoszkoplin.pl](https://bartoszkoplin.pl)

## Author

Built by [Bartosz Koplin](https://bartoszkoplin.pl) · contact: kontakt@bartoszkoplin.pl

Privacy policy: https://bartoszkoplin.pl/nofollow-privacy/

## License

All rights reserved. See [LICENSE](LICENSE). The source is published for transparency,
not for reuse.
