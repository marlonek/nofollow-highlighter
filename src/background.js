// Nofollow Highlighter - background (service worker in Chromium, event page in Firefox).
// 1) Sets default settings on install.
// 2) Shows the per-tab toolbar badge = number of non-dofollow links on the page.

// Cross-browser: Firefox exposes promise-based `browser`, Chromium uses `chrome`.
const chrome = globalThis.browser || globalThis.chrome;

const DEFAULTS = {
  enabled: true,
  style: "underline",
  visible: { dofollow: true, nofollow: true, sponsored: true, ugc: true },
  externalOnly: false,
  disabledSites: [],
};

const BADGE_BG = "#E24B4A";

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const next = {};
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (current[key] === undefined) next[key] = value;
  }
  if (Object.keys(next).length) await chrome.storage.local.set(next);

  chrome.action.setBadgeBackgroundColor({ color: BADGE_BG });
  if (chrome.action.setBadgeTextColor) chrome.action.setBadgeTextColor({ color: "#ffffff" });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.cmd === "badge" && sender.tab) {
    const n = msg.count | 0;
    const text = n > 999 ? "999+" : n > 0 ? String(n) : "";
    chrome.action.setBadgeText({ tabId: sender.tab.id, text });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: BADGE_BG });
  }
});
