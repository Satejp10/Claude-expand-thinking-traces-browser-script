// ==UserScript==
// @name         Claude.ai — Expand All (Thinking, Traces, Tools)
// @namespace    https://claude.ai/
// @version      1.2.1
// @description  One-click expand for Claude thinking output, traces, tool calls, and scripts. Hover 1s for individual options.
// @author       You
// @match        https://claude.ai/*
// @match        https://*.claude.ai/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const HOVER_DELAY_MS = 1000;
  const UI_OFFSET_RIGHT = '36px';
  const POSITION_STORAGE_KEY = 'claude-expand-all-position';

  // Fallbacks mirror Claude CDS tokens when host vars are not yet available
  const THEME_FALLBACK = {
    light: {
      pageBg: '#f4f3ee',
      surface: '#ffffff',
      text: '#2e2b26',
      secondary: '#5c5850',
      muted: '#8a877d',
      border: 'rgba(46, 43, 38, 0.1)',
      hover: 'rgba(46, 43, 38, 0.05)',
      brand: '#c6613f',
      shadow: '0 8px 24px rgba(46, 43, 38, 0.08), 0 2px 6px rgba(46, 43, 38, 0.04)',
    },
    dark: {
      pageBg: '#262522',
      surface: '#33322e',
      text: '#f4f3ee',
      secondary: '#b8b5ad',
      muted: '#8a877d',
      border: 'rgba(244, 243, 238, 0.1)',
      hover: 'rgba(244, 243, 238, 0.06)',
      brand: '#d97757',
      shadow: '0 8px 24px rgba(0, 0, 0, 0.32), 0 2px 6px rgba(0, 0, 0, 0.18)',
    },
  };

  const HOST_TOKEN_MAP = {
    '--cea-page-bg': '--cds-page-bg',
    '--cea-surface': '--cds-surface-popover',
    '--cea-text': '--cds-text-primary',
    '--cea-secondary': '--cds-text-secondary',
    '--cea-muted': '--cds-text-muted',
    '--cea-border': '--cds-border',
    '--cea-hover': '--cds-fill-ghost-hover',
    '--cea-shadow': '--cds-shadow-popover',
    '--cea-brand': '--cds-fill-brand',
  };

  const STYLES = `
    #cea-root {
      position: fixed;
      bottom: 24px;
      right: ${UI_OFFSET_RIGHT};
      z-index: 999999;
      font-family: var(--font-ui, "Anthropic Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
      font-size: var(--cea-font-size, 13px);
      line-height: 1.2;
      --cea-page-bg: #f4f3ee;
      --cea-surface: #ffffff;
      --cea-text: #2e2b26;
      --cea-secondary: #5c5850;
      --cea-muted: #8a877d;
      --cea-border: rgba(46, 43, 38, 0.1);
      --cea-hover: rgba(46, 43, 38, 0.05);
      --cea-brand: #c6613f;
      --cea-shadow: 0 8px 24px rgba(46, 43, 38, 0.08), 0 2px 6px rgba(46, 43, 38, 0.04);
      touch-action: none;
    }
    #cea-root[data-cea-theme="dark"] {
      --cea-page-bg: #262522;
      --cea-surface: #33322e;
      --cea-text: #f4f3ee;
      --cea-secondary: #b8b5ad;
      --cea-muted: #8a877d;
      --cea-border: rgba(244, 243, 238, 0.1);
      --cea-hover: rgba(244, 243, 238, 0.06);
      --cea-brand: #d97757;
      --cea-shadow: 0 8px 24px rgba(0, 0, 0, 0.32), 0 2px 6px rgba(0, 0, 0, 0.18);
    }
    #cea-root * { box-sizing: border-box; }
    #cea-main-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 0.5px solid var(--cea-border);
      background: var(--cea-page-bg);
      color: var(--cea-text);
      cursor: pointer;
      box-shadow: var(--cea-shadow);
      transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
      user-select: none;
      touch-action: none;
    }
    #cea-main-btn:hover, #cea-root.cea-menu-open #cea-main-btn {
      border-color: var(--cea-border);
      background: var(--cea-hover);
      box-shadow: var(--cea-shadow);
      transform: translateY(-1px);
    }
    #cea-root.cea-dragging #cea-main-btn {
      cursor: grabbing;
      transform: translateY(0);
    }
    #cea-main-btn:active { transform: translateY(0); }
    #cea-main-btn:disabled { opacity: 0.65; cursor: wait; }
    #cea-icon {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--cea-secondary);
      font-weight: 600;
    }
    #cea-main-btn:hover #cea-icon,
    #cea-root.cea-menu-open #cea-icon,
    #cea-root.cea-menu-visible #cea-icon {
      color: var(--cea-brand);
    }
    #cea-label { font-weight: 500; white-space: nowrap; }
    #cea-badge {
      font-size: 11px;
      font-weight: 500;
      color: var(--cea-muted);
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--cea-hover);
      border: 0.5px solid var(--cea-border);
    }
    #cea-menu {
      position: absolute;
      right: 0;
      bottom: calc(100% + 10px);
      min-width: 240px;
      padding: 6px;
      border-radius: 12px;
      border: 0.5px solid var(--cea-border);
      background: var(--cea-surface);
      box-shadow: var(--cea-shadow);
      opacity: 0;
      visibility: hidden;
      transform: translateY(6px);
      transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
      pointer-events: none;
    }
    #cea-root.cea-menu-open #cea-menu,
    #cea-root.cea-menu-visible #cea-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }
    #cea-menu-title {
      padding: 8px 10px 6px;
      color: var(--cea-muted);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .cea-item {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 10px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--cea-text);
      cursor: pointer;
      text-align: left;
      font: inherit;
      font-weight: 400;
    }
    .cea-item:hover { background: var(--cea-hover); }
    .cea-item:focus-visible {
      outline: 2px solid var(--cea-border);
      outline-offset: 1px;
    }
    .cea-item kbd {
      font-size: 10px;
      color: var(--cea-muted);
      border: 0.5px solid var(--cea-border);
      border-radius: 4px;
      padding: 1px 5px;
      font-family: inherit;
      background: var(--cea-hover);
    }
    .cea-divider {
      height: 0.5px;
      margin: 4px 6px;
      background: var(--cea-border);
    }
    #cea-root #cea-toast {
      position: fixed;
      bottom: 84px;
      right: ${UI_OFFSET_RIGHT};
      z-index: 999998;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--cea-surface);
      color: var(--cea-text);
      border: 0.5px solid var(--cea-border);
      box-shadow: var(--cea-shadow);
      font: 13px/1.3 var(--font-ui, "Anthropic Sans", ui-sans-serif, system-ui, sans-serif);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    }
    #cea-root #cea-toast.cea-show {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  function isClaudeDarkMode() {
    const html = document.documentElement;
    const mode = html.getAttribute('data-mode');
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    const cds = document.querySelector('.cds-root[data-mode]');
    const cdsMode = cds?.getAttribute('data-mode');
    if (cdsMode === 'dark') return true;
    if (cdsMode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function getThemeSource() {
    return (
      document.querySelector('.cds-root[data-mode]') ||
      document.querySelector('.cds-root') ||
      document.documentElement
    );
  }

  function applyFallbackTheme(root, dark) {
    const fb = THEME_FALLBACK[dark ? 'dark' : 'light'];
    root.style.setProperty('--cea-page-bg', fb.pageBg);
    root.style.setProperty('--cea-surface', fb.surface);
    root.style.setProperty('--cea-text', fb.text);
    root.style.setProperty('--cea-secondary', fb.secondary);
    root.style.setProperty('--cea-muted', fb.muted);
    root.style.setProperty('--cea-border', fb.border);
    root.style.setProperty('--cea-hover', fb.hover);
    root.style.setProperty('--cea-brand', fb.brand);
    root.style.setProperty('--cea-shadow', fb.shadow);
  }

  function applyClaudeTheme(root) {
    const dark = isClaudeDarkMode();
    root.dataset.ceaTheme = dark ? 'dark' : 'light';

    const source = getThemeSource();
    const computed = getComputedStyle(source);
    let synced = 0;

    Object.entries(HOST_TOKEN_MAP).forEach(([dest, srcVar]) => {
      const value = computed.getPropertyValue(srcVar).trim();
      if (value) {
        root.style.setProperty(dest, value);
        synced++;
      }
    });

    const fontSize = computed.getPropertyValue('--cds-font-size-body').trim();
    if (fontSize) root.style.setProperty('--cea-font-size', fontSize);

    if (synced < 3) applyFallbackTheme(root, dark);
  }

  function getChatContainer() {
    return (
      document.querySelector('[data-testid="chat-stale-nav-frame"]') ||
      document.querySelector('#root') ||
      document.body
    );
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function getElementLabel(el, includeText = false) {
    return [
      el?.getAttribute?.('aria-label'),
      el?.getAttribute?.('title'),
      el?.getAttribute?.('data-testid'),
      includeText ? el?.textContent : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function isArtifactLike(el) {
    if (!el) return false;
    const directText = getElementLabel(el, true);
    if (/\bartifact\b/.test(directText)) return true;
    if (/^(view|open|preview)\b/.test(directText.trim())) return true;

    let node = el;
    let depth = 0;
    while (node && node !== document.body && depth < 8) {
      const classText =
        typeof node.className === 'string' ? node.className.toLowerCase() : String(node.className || '').toLowerCase();
      const nodeText = getElementLabel(node);
      if (classText.includes('artifact') || /\bartifact\b/.test(nodeText)) return true;
      node = node.parentElement;
      depth++;
    }
    return false;
  }

  function clickAuto(el) {
    if (!el || !isVisible(el) || isArtifactLike(el)) return false;
    el.click();
    return true;
  }

  function clickIfCollapsed(el) {
    if (el?.getAttribute('aria-expanded') === 'false') {
      return clickAuto(el);
    }
    return false;
  }

  function findShowMoreButtons(root) {
    return [...root.querySelectorAll('button')].filter((btn) => {
      const t = btn.textContent.trim();
      return t === 'Show more' && isVisible(btn) && !isArtifactLike(btn);
    });
  }

  function findThinkingButtons(root) {
    return [...root.querySelectorAll('button.group\\/status, button[class*="group/status"]')].filter(
      (btn) => btn.getAttribute('aria-expanded') === 'false' && isVisible(btn) && !isArtifactLike(btn)
    );
  }

  function isToolRowCollapsed(btn) {
    const itemRow = btn.closest('.flex.flex-row.items-center');
    if (!itemRow) return true;
    const block = itemRow.parentElement;
    if (!block) return true;
    const detailRows = [...block.querySelectorAll(':scope > .flex.flex-row')].filter(
      (r) => !r.classList.contains('items-center')
    );
    if (!detailRows.length) return true;
    return detailRows.every((row) => {
      const inner = row.querySelector('.flex-1.min-w-0');
      if (!inner) return true;
      if (inner.childElementCount === 0) return true;
      const hidden = inner.querySelector('[style*="height: 0"], [style*="opacity: 0"]');
      return !!hidden;
    });
  }

  function findToolRowButtons(root) {
    return [...root.querySelectorAll('button.group\\/row, button[class*="group/row"]')].filter(
      (btn) => {
        if (!isVisible(btn)) return false;
        if (isArtifactLike(btn)) return false;
        if (btn.className.includes('cursor-default')) return false;
        if (btn.getAttribute('aria-disabled') === 'true') return false;
        return isToolRowCollapsed(btn);
      }
    );
  }

  function expandTruncatedTimelineText(root) {
    let count = 0;
    root.querySelectorAll('[data-timeline-text]').forEach((block) => {
      if (isArtifactLike(block)) return;
      block.querySelectorAll('[style*="max-height"]').forEach((el) => {
        if (isArtifactLike(el)) return;
        const mh = el.style.maxHeight;
        if (mh && mh !== 'none' && mh !== '9999px') {
          el.style.maxHeight = 'none';
          el.style.overflow = 'visible';
          count++;
        }
      });
      block.querySelectorAll('.bg-gradient-to-t').forEach((g) => {
        if (isArtifactLike(g)) return;
        g.style.display = 'none';
      });
    });
    return count;
  }

  function expandCodePanels(root) {
    let count = 0;
    const selectors = [
      '.font-claude-response [class*="max-h-["]',
      '.font-claude-response .overflow-y-auto',
      '.font-claude-response pre',
      '.font-claude-response .code-block__code',
    ];
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => {
        if (isArtifactLike(el)) return;
        if (!el.closest('.font-claude-response') && !el.closest('[data-is-streaming]')) return;
        const cls = el.className || '';
        if (typeof cls === 'string' && /max-h-\[/.test(cls)) {
          el.style.maxHeight = 'none';
          el.style.overflow = 'visible';
          count++;
        }
      });
    });
    root.querySelectorAll('.font-claude-response [class*="max-h-[200px]"]').forEach((el) => {
      if (isArtifactLike(el)) return;
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      count++;
    });
    return count;
  }

  function collapseAll(root) {
    let count = 0;
    [...root.querySelectorAll('button.group\\/status, button[class*="group/status"]')]
      .filter((btn) => btn.getAttribute('aria-expanded') === 'true' && !isArtifactLike(btn))
      .forEach((btn) => {
        if (clickAuto(btn)) count++;
      });
    return count;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function runAction(action) {
    const root = getChatContainer();
    const stats = { thinking: 0, showMore: 0, tools: 0, text: 0, code: 0, artifacts: 0, collapsed: 0 };

    if (action === 'all' || action === 'thinking') {
      const btns = findThinkingButtons(root);
      for (const btn of btns) {
        if (clickIfCollapsed(btn)) {
          stats.thinking++;
          await sleep(80);
        }
      }
    }

    if (action === 'all' || action === 'tools') {
      await sleep(action === 'all' ? 200 : 0);
      const rows = findToolRowButtons(root);
      for (const btn of rows) {
        if (clickAuto(btn)) {
          stats.tools++;
          await sleep(60);
        }
      }
    }

    if (action === 'all' || action === 'showMore') {
      const more = findShowMoreButtons(root);
      for (const btn of more) {
        if (clickAuto(btn)) {
          stats.showMore++;
          await sleep(40);
        }
      }
    }

    if (action === 'all' || action === 'text') {
      stats.text = expandTruncatedTimelineText(root);
    }

    if (action === 'all' || action === 'code') {
      stats.code = expandCodePanels(root);
    }

    if (action === 'collapse') {
      stats.collapsed = collapseAll(root);
    }

    return stats;
  }

  function formatStats(action, stats) {
    if (action === 'collapse') {
      return `Collapsed ${stats.collapsed} thinking block${stats.collapsed === 1 ? '' : 's'}`;
    }
    const parts = [];
    if (stats.thinking) parts.push(`${stats.thinking} thinking`);
    if (stats.tools) parts.push(`${stats.tools} tools`);
    if (stats.showMore) parts.push(`${stats.showMore} show-more`);
    if (stats.text) parts.push(`${stats.text} text panels`);
    if (stats.code) parts.push(`${stats.code} code panels`);
    if (stats.artifacts) parts.push(`${stats.artifacts} artifacts`);
    return parts.length ? `Expanded: ${parts.join(', ')}` : 'Nothing left to expand on this page';
  }

  let toastTimer;
  let ceaRootEl = null;

  function toast(msg) {
    const host = ceaRootEl || document.getElementById('cea-root');
    let el = host?.querySelector('#cea-toast');
    if (!el && host) {
      el = document.createElement('div');
      el.id = 'cea-toast';
      host.appendChild(el);
    }
    if (!el) return;
    el.textContent = msg;
    el.classList.add('cea-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('cea-show'), 2600);
  }

  function countPending() {
    const root = getChatContainer();
    return (
      findThinkingButtons(root).length +
      findShowMoreButtons(root).length +
      findToolRowButtons(root).length
    );
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getStoredPosition() {
    try {
      const raw = localStorage.getItem(POSITION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Number.isFinite(parsed?.left) || !Number.isFinite(parsed?.top)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function savePosition(root) {
    const rect = root.getBoundingClientRect();
    localStorage.setItem(
      POSITION_STORAGE_KEY,
      JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) })
    );
  }

  function applyPosition(root, left, top) {
    const rect = root.getBoundingClientRect();
    const margin = 8;
    const nextLeft = clamp(left, margin, window.innerWidth - rect.width - margin);
    const nextTop = clamp(top, margin, window.innerHeight - rect.height - margin);
    root.style.left = `${Math.round(nextLeft)}px`;
    root.style.top = `${Math.round(nextTop)}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  }

  function restorePosition(root) {
    const pos = getStoredPosition();
    if (pos) applyPosition(root, pos.left, pos.top);
  }

  function makeDraggable(root, handle, menu) {
    let drag = null;
    let suppressClick = false;

    function finishDrag() {
      if (!drag) return;
      const didMove = drag.moved;
      drag = null;
      root.classList.remove('cea-dragging');
      if (didMove) {
        savePosition(root);
        suppressClick = true;
        setTimeout(() => {
          suppressClick = false;
        }, 0);
      }
    }

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || handle.disabled) return;
      const rect = root.getBoundingClientRect();
      drag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        left: rect.left,
        top: rect.top,
        moved: false,
      };
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      root.classList.add('cea-dragging');
      root.classList.remove('cea-menu-open', 'cea-menu-visible');
      applyPosition(root, drag.left + dx, drag.top + dy);
    });

    handle.addEventListener('pointerup', (e) => {
      if (drag && e.pointerId === drag.pointerId) finishDrag();
    });

    handle.addEventListener('pointercancel', (e) => {
      if (drag && e.pointerId === drag.pointerId) finishDrag();
    });

    handle.addEventListener(
      'click',
      (e) => {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true
    );

    window.addEventListener('resize', () => {
      const rect = root.getBoundingClientRect();
      applyPosition(root, rect.left, rect.top);
      savePosition(root);
    });

    menu.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  function buildUI() {
    if (document.getElementById('cea-root')) return;

    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'cea-root';
    root.innerHTML = `
      <div id="cea-menu" role="menu" aria-label="Expand options">
        <div id="cea-menu-title">Expand individually</div>
        <button class="cea-item" data-action="thinking" role="menuitem">
          <span>Thinking traces</span>
        </button>
        <button class="cea-item" data-action="tools" role="menuitem">
          <span>Tool calls &amp; outputs</span>
        </button>
        <button class="cea-item" data-action="showMore" role="menuitem">
          <span>“Show more” text</span>
        </button>
        <button class="cea-item" data-action="text" role="menuitem">
          <span>Uncap timeline height</span>
        </button>
        <button class="cea-item" data-action="code" role="menuitem">
          <span>Code / script panels</span>
        </button>
        <div class="cea-divider"></div>
        <button class="cea-item" data-action="collapse" role="menuitem">
          <span>Collapse all thinking</span>
        </button>
      </div>
      <button id="cea-main-btn" type="button" title="Expand all thinking, traces, tools, and scripts">
        <span id="cea-icon">⤢</span>
        <span id="cea-label">Expand all</span>
        <span id="cea-badge">0</span>
      </button>
    `;
    document.body.appendChild(root);
    ceaRootEl = root;
    applyClaudeTheme(root);
    requestAnimationFrame(() => restorePosition(root));

    const themeObserver = new MutationObserver(() => applyClaudeTheme(root));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode', 'data-theme', 'class'],
    });
    const cdsRoot = document.querySelector('.cds-root');
    if (cdsRoot) {
      themeObserver.observe(cdsRoot, {
        attributes: true,
        attributeFilter: ['data-mode'],
      });
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      applyClaudeTheme(root);
    });

    // CDS tokens may load after first paint
    const resyncTheme = () => applyClaudeTheme(root);
    setTimeout(resyncTheme, 500);
    setTimeout(resyncTheme, 2000);

    const mainBtn = root.querySelector('#cea-main-btn');
    const badge = root.querySelector('#cea-badge');
    const menu = root.querySelector('#cea-menu');
    makeDraggable(root, mainBtn, menu);

    let hoverTimer = null;
    let hideTimer = null;
    let menuPinned = false;

    function updateBadge() {
      badge.textContent = String(countPending());
    }

    function showMenu() {
      clearTimeout(hideTimer);
      root.classList.add('cea-menu-visible');
    }

    function hideMenu(force = false) {
      if (menuPinned && !force) return;
      clearTimeout(hoverTimer);
      hideTimer = setTimeout(() => {
        if (!menuPinned) root.classList.remove('cea-menu-visible', 'cea-menu-open');
      }, 180);
    }

    root.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      hoverTimer = setTimeout(showMenu, HOVER_DELAY_MS);
    });

    root.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      hideMenu();
    });

    mainBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      menuPinned = false;
      root.classList.remove('cea-menu-open', 'cea-menu-visible');
      mainBtn.disabled = true;
      const stats = await runAction('all');
      toast(formatStats('all', stats));
      mainBtn.disabled = false;
      updateBadge();
    });

    menu.addEventListener('click', async (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      e.stopPropagation();
      const action = item.dataset.action;
      menuPinned = false;
      root.classList.remove('cea-menu-open', 'cea-menu-visible');
      const stats = await runAction(action);
      toast(formatStats(action, stats));
      updateBadge();
    });

    menu.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    menu.addEventListener('mouseleave', () => hideMenu());

    document.addEventListener('click', () => {
      menuPinned = false;
      hideMenu(true);
    });

    updateBadge();
    setInterval(updateBadge, 2000);

    const observer = new MutationObserver(() => updateBadge());
    observer.observe(getChatContainer(), { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
