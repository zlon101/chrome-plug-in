import { safeRemove, canHighlight } from './delete-element.js';

export const HighlightCls = 'zl_picker_highlight';
export const OverlayCls = 'zl_picker_overlay';

const HIGHLIGHT_COLOR = '#409eff';
const STYLE_ID = 'zl-picker-style';

function escapeCssIdent(value) {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value);
  }
  return String(value).replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

function querySelectorCount(selector) {
  try {
    return document.querySelectorAll(selector).length;
  } catch (_) {
    return 0;
  }
}

export function generateSelector(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;

  if (el.id) {
    const selector = `#${escapeCssIdent(el.id)}`;
    if (querySelectorCount(selector) === 1) return selector;
  }

  const parts = [];
  let current = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c && c !== HighlightCls && !/[^a-zA-Z0-9_-]/.test(c));
      if (classes.length > 0) {
        const classSelector = selector + '.' + classes.map(escapeCssIdent).join('.');
        let candidates = [];
        try {
          candidates = current.parentElement
            ? Array.from(current.parentElement.querySelectorAll(classSelector))
            : [];
        } catch (_) {}
        if (candidates.length === 1 && candidates[0] === current) {
          selector = classSelector;
          parts.unshift(selector);
          break;
        }
      }
    }

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        c => c.tagName === current.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  const fullSelector = parts.join(' > ');

  try {
    const matched = document.querySelectorAll(fullSelector);
    if (matched.length === 1 && matched[0] === el) {
      return fullSelector;
    }
  } catch (_) {}

  return buildFullPath(el);
}

function buildFullPath(el) {
  const parts = [];
  let current = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${escapeCssIdent(current.id)}`;
      parts.unshift(selector);
      break;
    }
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        c => c.tagName === current.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

export function getElementLabel(element) {
  const tag = element.tagName.toLowerCase();
  if (element.id) return `#${element.id}`;
  if (element.className && typeof element.className === 'string') {
    const cls = element.className.trim().split(/\s+/).slice(0, 2).join('.');
    if (cls) return `.${cls}`;
  }
  return tag;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function buildOverlayHtml(element) {
  let selector = '';
  try {
    selector = generateSelector(element) || '';
  } catch (_) {}
  const label = getElementLabel(element);
  return `
    <div style="margin-bottom:4px;color:#aaa;font-size:11px;">${label} <span style="color:#666">(${element.tagName.toLowerCase()})</span></div>
    <div class="zl_picker_selector" style="color:#7ec699;">${selector || ''}</div>
    <div style="margin-top:6px;color:#888;font-size:11px;">CapsLock+C 复制 / CapsLock+D 删除 / ESC 退出</div>
  `;
}

let picker = null;

function createUnifiedPicker() {
  let isActive = false;
  let hoveredEl = null;

  function removeOverlay() {
    document.querySelector(`.${OverlayCls}`)?.remove();
  }

  function showFlashHint(text, color = '#ffd700') {
    const overlay = document.querySelector(`.${OverlayCls}`);
    if (!overlay) return;
    overlay.querySelector('.zl_picker_flash')?.remove();
    const hint = document.createElement('div');
    hint.className = 'zl_picker_flash';
    hint.textContent = text;
    hint.style.cssText = `color:${color};font-size:12px;margin-top:4px;`;
    overlay.appendChild(hint);
    setTimeout(() => hint.remove(), 1500);
  }

  function showOverlay(element) {
    removeOverlay();

    const overlay = document.createElement('div');
    overlay.className = OverlayCls;
    overlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-family: monospace;
      z-index: 2147483647;
      max-width: 80vw;
      word-break: break-all;
      user-select: all;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    `;
    overlay.innerHTML = buildOverlayHtml(element);
    document.body.appendChild(overlay);
  }

  function clearHighlight() {
    document.querySelectorAll(`.${HighlightCls}`).forEach(el => el.classList.remove(HighlightCls));
    removeOverlay();
    hoveredEl = null;
  }

  function highlightElement(el) {
    if (hoveredEl && hoveredEl !== el) {
      hoveredEl.classList.remove(HighlightCls);
    }
    removeOverlay();
    hoveredEl = null;

    if (!canHighlight(el)) return;
    hoveredEl = el;
    el.classList.add(HighlightCls);
    showOverlay(el);
  }

  function onMouseMove(e) {
    const target = e.target;
    if (target.closest(`.${OverlayCls}`)) return;
    if (target === hoveredEl) return;
    highlightElement(target);
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function copySelector(el) {
    const selector = generateSelector(el);
    if (!selector) return;
    navigator.clipboard.writeText(selector).then(() => {
      showFlashHint('已复制到剪贴板!');
    });
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      stop();
      return;
    }

    if (!e.getModifierState('CapsLock') || !hoveredEl) return;

    if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      copySelector(hoveredEl);
      return;
    }

    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      const removed = safeRemove(hoveredEl);
      if (removed) {
        hoveredEl = null;
        removeOverlay();
        const toast = document.createElement('div');
        toast.className = OverlayCls;
        toast.style.cssText = `
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.85); color: #f56c6c; padding: 8px 16px;
          border-radius: 6px; font-size: 13px; z-index: 2147483647;
        `;
        toast.textContent = '已删除';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1000);
      }
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const rgb = hexToRgb(HIGHLIGHT_COLOR);
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
      .${HighlightCls} {
        outline: 2px solid ${HIGHLIGHT_COLOR} !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px ${HIGHLIGHT_COLOR} !important;
        background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06) !important;
        cursor: crosshair !important;
        position: relative;
        z-index: 2147483646;
      }
    `;
    document.head.appendChild(styleEl);
  }

  function start(initialTarget) {
    if (isActive) return;
    isActive = true;
    injectStyle();
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    if (initialTarget && canHighlight(initialTarget)) {
      highlightElement(initialTarget);
    }
  }

  function stop() {
    if (!isActive) return;
    isActive = false;
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    clearHighlight();
  }

  return { start, stop, get isActive() { return isActive; } };
}

export function execPickElement(initialTarget) {
  if (!picker) {
    picker = createUnifiedPicker();
  }
  if (picker.isActive) return;
  picker.start(initialTarget);
}
