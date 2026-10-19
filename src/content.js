// Nofollow Highlighter - content script.
// Marks links by their rel attribute for SEO review. Runs fully locally:
// reads the DOM, adds attributes/classes, never sends any data anywhere.

(() => {
  "use strict";

  // Cross-browser: Firefox exposes promise-based `browser`, Chromium uses `chrome`.
  const chrome = globalThis.browser || globalThis.chrome;

  if (window.__nofollowHL) return;

  const DEFAULT_VISIBLE = { dofollow: true, nofollow: true, sponsored: true, ugc: true };
  const NON_DOFOLLOW = ["nofollow", "sponsored", "ugc"];

  const api = {
    style: "underline", // "underline" (B), "badge" (A), "both" (C)
    visible: { ...DEFAULT_VISIBLE },
    externalOnly: false,
    active: false,
    observer: null,
    _debounce: null,
    _pending: null,

    // Link type from rel. Priority: sponsored > ugc > nofollow > dofollow.
    classify(a) {
      const set = new Set((a.getAttribute("rel") || "").toLowerCase().split(/\s+/).filter(Boolean));
      if (set.has("sponsored")) return "sponsored";
      if (set.has("ugc")) return "ugc";
      if (set.has("nofollow")) return "nofollow";
      return "dofollow";
    },

    // Only real http(s) links (skip #, mailto:, tel:, javascript:).
    eligible(a) {
      if (!a.getAttribute("href")) return false;
      return a.protocol === "http:" || a.protocol === "https:";
    },

    isExternal(a) {
      return !!(a.hostname && a.hostname !== location.hostname);
    },

    shouldShow(a, type) {
      if (!this.visible[type]) return false;
      if (this.externalOnly && !this.isExternal(a)) return false;
      return true;
    },

    decorate(a) {
      const type = this.classify(a);
      a.setAttribute("data-nf", type);
      a.classList.add("nf-link");
      a.classList.toggle("nf-on", this.shouldShow(a, type));

      if (!a.dataset.nfTitleSet) {
        const rel = a.getAttribute("rel") || "(none)";
        a.dataset.nfOrigTitle = a.getAttribute("title") || "";
        a.setAttribute(
          "title",
          `[SEO] ${type.toUpperCase()} · rel="${rel}" · ${this.isExternal(a) ? "external" : "internal"}`
        );
        a.dataset.nfTitleSet = "1";
      }
    },

    // Cheap update of an already-decorated link (no re-classify).
    applyVisibility(a) {
      const type = a.getAttribute("data-nf");
      if (type) a.classList.toggle("nf-on", this.shouldShow(a, type));
    },

    // Full scan: classify + decorate every eligible link. Used once per page.
    markAll() {
      document.documentElement.setAttribute("data-nf-style", this.style);
      document.querySelectorAll("a[href]").forEach((a) => {
        if (this.eligible(a)) this.decorate(a);
      });
      this.active = true;
      this.updateBadge();
    },

    // Fast path for setting changes: only flips classes/style on known links.
    reconcile() {
      document.documentElement.setAttribute("data-nf-style", this.style);
      document.querySelectorAll("a.nf-link").forEach((a) => this.applyVisibility(a));
      this.updateBadge();
    },

    count() {
      const counts = { dofollow: 0, nofollow: 0, sponsored: 0, ugc: 0, total: 0 };
      document.querySelectorAll("a.nf-link[data-nf]").forEach((a) => {
        const t = a.getAttribute("data-nf");
        if (t in counts) {
          counts[t]++;
          counts.total++;
        }
      });
      return counts;
    },

    nonDofollowCount() {
      let n = 0;
      document.querySelectorAll("a.nf-link[data-nf]").forEach((a) => {
        if (NON_DOFOLLOW.includes(a.getAttribute("data-nf"))) n++;
      });
      return n;
    },

    // Toolbar icon badge = number of non-dofollow links detected on the page.
    updateBadge() {
      try {
        chrome.runtime.sendMessage({ cmd: "badge", count: this.active ? this.nonDofollowCount() : 0 });
      } catch (_) {
        /* service worker not ready - harmless */
      }
    },

    clear() {
      document.querySelectorAll("a.nf-link").forEach((a) => {
        a.classList.remove("nf-link", "nf-on");
        a.removeAttribute("data-nf");
        if (a.dataset.nfTitleSet) {
          if (a.dataset.nfOrigTitle) a.setAttribute("title", a.dataset.nfOrigTitle);
          else a.removeAttribute("title");
          delete a.dataset.nfOrigTitle;
          delete a.dataset.nfTitleSet;
        }
      });
      document.documentElement.removeAttribute("data-nf-style");
      this.active = false;
      this.updateBadge();
    },

    // Watches dynamically added content (infinite scroll, SPA) incrementally:
    // only newly added nodes are scanned, never the whole document again.
    observe() {
      if (this.observer) return;
      this._pending = new Set();
      this.observer = new MutationObserver((records) => {
        if (!this.active) return;
        for (const r of records) {
          for (const node of r.addedNodes) {
            if (node.nodeType === 1) this._pending.add(node);
          }
        }
        if (this._pending.size) {
          clearTimeout(this._debounce);
          this._debounce = setTimeout(() => this._flush(), 200);
        }
      });
      this.observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
      });
    },

    _flush() {
      const nodes = this._pending;
      this._pending = new Set();
      nodes.forEach((node) => {
        if (!node.isConnected) return;
        if (node.matches && node.matches("a[href]") && this.eligible(node)) this.decorate(node);
        if (node.querySelectorAll) {
          node.querySelectorAll("a[href]:not(.nf-link)").forEach((a) => {
            if (this.eligible(a)) this.decorate(a);
          });
        }
      });
      this.updateBadge();
    },

    disconnect() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      clearTimeout(this._debounce);
      if (this._pending) this._pending.clear();
    },

    // Reads settings and marks / updates / clears the page accordingly.
    async apply() {
      const s = await chrome.storage.local.get([
        "enabled",
        "style",
        "visible",
        "externalOnly",
        "disabledSites",
      ]);
      this.style = s.style || "underline";
      this.visible = { ...DEFAULT_VISIBLE, ...(s.visible || {}) };
      this.externalOnly = !!s.externalOnly;

      const enabled = s.enabled !== false; // default: on
      const siteOff = Array.isArray(s.disabledSites) && s.disabledSites.includes(location.hostname);

      if (enabled && !siteOff) {
        if (this.active) this.reconcile();
        else {
          this.observe();
          this.markAll();
        }
      } else {
        this.clear();
        this.disconnect();
      }
    },
  };

  window.__nofollowHL = api;

  // React live to settings changes (popup toggles) without a reload.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (
      changes.enabled ||
      changes.style ||
      changes.visible ||
      changes.externalOnly ||
      changes.disabledSites
    ) {
      api.apply();
    }
  });

  // Popup communication: read state, or force an immediate re-apply.
  chrome.runtime.onMessage.addListener((msg, _sender, send) => {
    if (!msg) {
      send({ error: "unknown" });
      return true;
    }
    if (msg.cmd === "state") {
      send({
        active: api.active,
        style: api.style,
        visible: api.visible,
        externalOnly: api.externalOnly,
        host: location.hostname,
        counts: api.active ? api.count() : null,
      });
      return true;
    }
    if (msg.cmd === "apply") {
      api.apply().then(() =>
        send({ ok: true, active: api.active, counts: api.active ? api.count() : null })
      );
      return true; // async response
    }
    send({ error: "unknown" });
    return true;
  });

  api.apply();
})();
