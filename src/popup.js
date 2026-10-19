// Nofollow Highlighter - popup (settings hub).
// All controls just write to chrome.storage.local; content scripts react live
// via storage.onChanged, so changes apply without reloading tabs.

// Cross-browser: Firefox exposes promise-based `browser`, Chromium uses `chrome`.
const chrome = globalThis.browser || globalThis.chrome;

const TYPES = ["dofollow", "nofollow", "sponsored", "ugc"];
const DEFAULT_VISIBLE = { dofollow: true, nofollow: true, sponsored: true, ugc: true };
const $ = (id) => document.getElementById(id);

function showMsg(text) {
  const el = $("msg");
  el.textContent = text || "";
  el.hidden = !text;
}

function renderStats(counts) {
  const box = $("stats");
  if (!counts || !counts.total) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  TYPES.forEach((t) => ($("c-" + t).textContent = counts[t]));
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function hostOf(tab) {
  try {
    const u = new URL(tab.url);
    return /^https?:$/.test(u.protocol) ? u.hostname : "";
  } catch (_) {
    return "";
  }
}

async function refreshStats(tab) {
  try {
    const state = await chrome.tabs.sendMessage(tab.id, { cmd: "state" });
    renderStats(state && state.active ? state.counts : null);
  } catch (_) {
    renderStats(null);
  }
}

// Force the active tab to re-apply settings immediately, then show fresh counts.
// If the tab runs an outdated/absent content script, ask the user to reload it.
async function pushAndRefresh() {
  const tab = await activeTab();
  if (!tab) return;
  try {
    const r = await chrome.tabs.sendMessage(tab.id, { cmd: "apply" });
    renderStats(r && r.active ? r.counts : null);
  } catch (_) {
    renderStats(null);
    if (hostOf(tab)) showMsg("Reload this tab once to apply changes (it was open before the extension updated).");
  }
}

async function init() {
  const s = await chrome.storage.local.get([
    "enabled",
    "style",
    "visible",
    "externalOnly",
    "disabledSites",
  ]);
  const visible = { ...DEFAULT_VISIBLE, ...(s.visible || {}) };

  $("enabled").checked = s.enabled !== false;
  $("style").value = s.style || "underline";
  $("external").checked = !!s.externalOnly;
  TYPES.forEach((t) => ($("t-" + t).checked = !!visible[t]));

  const tab = await activeTab();
  const host = tab ? hostOf(tab) : "";
  const disabled = Array.isArray(s.disabledSites) ? s.disabledSites : [];

  if (host) {
    $("host").textContent = host;
    $("site").checked = !disabled.includes(host);
    $("site").disabled = false;
  } else {
    $("host").textContent = "unavailable on this page";
    $("site").checked = false;
    $("site").disabled = true;
  }

  if (tab) refreshStats(tab);
}

$("enabled").addEventListener("change", async (e) => {
  showMsg("");
  await chrome.storage.local.set({ enabled: e.target.checked });
  pushAndRefresh();
});

$("site").addEventListener("change", async (e) => {
  showMsg("");
  const tab = await activeTab();
  const host = hostOf(tab);
  if (!host) return;
  const s = await chrome.storage.local.get("disabledSites");
  const list = new Set(Array.isArray(s.disabledSites) ? s.disabledSites : []);
  if (e.target.checked) list.delete(host);
  else list.add(host);
  await chrome.storage.local.set({ disabledSites: [...list] });
  pushAndRefresh();
});

$("style").addEventListener("change", async (e) => {
  showMsg("");
  await chrome.storage.local.set({ style: e.target.value });
  pushAndRefresh();
});

$("external").addEventListener("change", async (e) => {
  showMsg("");
  await chrome.storage.local.set({ externalOnly: e.target.checked });
  pushAndRefresh();
});

TYPES.forEach((t) => {
  $("t-" + t).addEventListener("change", async () => {
    showMsg("");
    const s = await chrome.storage.local.get("visible");
    const visible = { ...DEFAULT_VISIBLE, ...(s.visible || {}) };
    visible[t] = $("t-" + t).checked;
    await chrome.storage.local.set({ visible });
    pushAndRefresh();
  });
});

init();
