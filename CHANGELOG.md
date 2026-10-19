# Changelog

All notable changes to Nofollow Highlighter are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version here is the same value as `version` in `manifest.json` — keep them in sync
with every release.

## [Unreleased]

### Added
- Firefox (AMO) build: `manifest.firefox.json` (`background.scripts` event page +
  `browser_specific_settings.gecko.id`) packaged as `dist/nofollow-highlighter-1.2.0-firefox.zip`.

### Changed
- Cross-browser: scripts now alias `globalThis.browser || globalThis.chrome`, so one
  codebase runs on Chromium (Chrome/Edge/Opera) and Firefox. Behavior-neutral on Chromium.

## [1.2.0] - 2026-10-19

### Added
- Toolbar icon badge showing the number of non-dofollow links (nofollow + sponsored +
  ugc) detected on the current page, per tab.
- "External links only" filter: highlight only links pointing to a different domain.

### Changed
- Performance: `MutationObserver` now scans only newly added nodes instead of
  re-querying the whole document, and disconnects when highlighting is inactive.
- Performance: setting changes use a fast reconcile path (flip classes on known links)
  instead of re-classifying every link on the page.
- Accessibility: badges now use a light background with same-hue dark text (plus a thin
  colored border) for readable contrast in all four colors, including orange.

### Security
- Least privilege: replaced `<all_urls>` with explicit `http://*/*` and `https://*/*`
  host permissions; content script matches `http`/`https` (plus `file:///*` only for the
  local test page), no longer `ftp:` or other schemes.

## [1.1.1] - 2026-10-19

### Fixed
- Toggling link-type checkboxes (and the other controls) now updates the active tab
  immediately: the popup pushes an `apply` message to the current tab in addition to
  the `storage.onChanged` listener. If a tab was open before the extension was updated,
  the popup now shows a one-time "reload this tab" hint instead of appearing to do nothing.

## [1.1.0] - 2026-10-19

### Added
- Global on/off switch (`Highlighting enabled`) in the popup.
- Per-site toggle (`Active on this site`) with a persistent per-domain exclusion list.
- Link-type checkboxes to choose which types are highlighted (dofollow, nofollow,
  sponsored, ugc) — e.g. show only nofollow, or nofollow + ugc. Each checkbox doubles
  as the color legend.
- Live updates: popup changes apply to open tabs instantly via `storage.onChanged`,
  no reload needed.
- `CHANGELOG.md` and SemVer versioning policy.

### Changed
- Full UI translated to English for a global audience.
- Marking now runs automatically on pages (declared `content_scripts`) instead of the
  manual "Mark this page" button + dynamic registration.
- Underline style B switched from `border-bottom` to `text-decoration: underline`
  (with offset), so it no longer looks like a strikethrough on complex links such as
  Google search results.

### Removed
- Manual "Mark this page" / "Clear" buttons.
- `activeTab` and `scripting` permissions and dynamic content-script registration
  (no longer needed under the auto model).

## [1.0.0] - 2026-10-19

### Added
- Initial Manifest V3 extension.
- Classifies links by `rel`: dofollow (green), nofollow (red), sponsored (orange),
  ugc (blue); multi-value priority sponsored > ugc > nofollow.
- Three marking styles: badge (A), underline (B, default), both (C).
- Hybrid mode: manual per-page marking plus an optional "always on" auto mode.
- Popup with counters, style selector and color legend.
- `MutationObserver` support for dynamically loaded links.
- Tooltip showing full `rel` value and internal/external status.

[Unreleased]: https://example.com/compare/v1.2.0...HEAD
[1.2.0]: https://example.com/releases/v1.2.0
[1.1.1]: https://example.com/releases/v1.1.1
[1.1.0]: https://example.com/releases/v1.1.0
[1.0.0]: https://example.com/releases/v1.0.0
