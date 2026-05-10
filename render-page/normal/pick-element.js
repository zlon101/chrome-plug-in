import { addListenerFromPopup, MsgType } from './message.js';

const HighlightCls = 'zl_picker_highlight';
const OverlayCls = 'zl_picker_overlay';

let isActive = false;
let hoveredEl = null;

function generateSelector(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;

  // 尝试 id（最快且唯一）
  if (el.id) {
    const selector = `#${el.id}`;
    if (document.querySelectorAll(selector).length === 1) return selector;
  }

  const parts = [];
  let current = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    // 尝试添加 class 提高特异性
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c && !/[^a-zA-Z0-9_-]/.test(c));
      if (classes.length > 0) {
        const classSelector = selector + '.' + classes.join('.');
        const candidates = current.parentElement
          ? Array.from(current.parentElement.querySelectorAll(classSelector))
          : [];
        // 如果加 class 后只剩一个匹配，就用 class
        if (candidates.length === 1 && candidates[0] === current) {
          selector = classSelector;
          parts.unshift(selector);
          break;
        }
        // 否则用 nth-of-type
      }
    }

    // 使用 nth-of-type 确保唯一性
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

  // 最终验证
  try {
    const matched = document.querySelectorAll(fullSelector);
    if (matched.length === 1 && matched[0] === el) {
      return fullSelector;
    }
  } catch (_) {}

  // fallback: 使用完整路径
  return buildFullPath(el);
}

function buildFullPath(el) {
  const parts = [];
  let current = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
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

function showOverlay(selector, element) {
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
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  `;

  const tag = element.tagName.toLowerCase();
  const label = element.id ? `#${element.id}` : (element.className && typeof element.className === 'string' ? `.${element.className.trim().split(/\s+/).slice(0, 2).join('.')}` : tag);

  overlay.innerHTML = `<div style="margin-bottom:4px;color:#aaa;font-size:11px;">${label} <span style="color:#666">(${element.tagName.toLowerCase()})</span></div><div style="color:#7ec699;">${selector}</div><div style="margin-top:6px;color:#888;font-size:11px;">点击复制选择器，按 ESC 退出</div>`;

  overlay.addEventListener('click', () => {
    navigator.clipboard.writeText(selector).then(() => {
      const copiedHint = document.createElement('div');
      copiedHint.textContent = '已复制到剪贴板!';
      copiedHint.style.cssText = 'color:#ffd700;font-size:12px;margin-top:4px;';
      overlay.appendChild(copiedHint);
      setTimeout(() => copiedHint.remove(), 1500);
    });
  });

  document.body.appendChild(overlay);
}

function removeOverlay() {
  document.querySelector(`.${OverlayCls}`)?.remove();
}

function highlightElement(el) {
  clearHighlight();
  if (!el || el === document.body || el === document.documentElement) return;
  hoveredEl = el;
  el.classList.add(HighlightCls);
  const selector = generateSelector(el);
  if (selector) showOverlay(selector, el);
}

function clearHighlight() {
  document.querySelectorAll(`.${HighlightCls}`).forEach(el => el.classList.remove(HighlightCls));
  removeOverlay();
  hoveredEl = null;
}

function startPicker() {
  if (isActive) return;
  isActive = true;

  // 注入高亮样式
  let styleEl = document.getElementById('zl-picker-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'zl-picker-style';
    styleEl.textContent = `
      .${HighlightCls} {
        outline: 2px dashed #409eff !important;
        outline-offset: 1px;
        background: rgba(64, 158, 255, 0.08) !important;
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}

function stopPicker() {
  isActive = false;
  document.removeEventListener('mousemove', onMouseMove, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  clearHighlight();
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
  if (hoveredEl) {
    const selector = generateSelector(hoveredEl);
    if (selector) {
      navigator.clipboard.writeText(selector);
    }
  }
  stopPicker();
}

function onKeyDown(e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    stopPicker();
  }
}

export function execPickElement() {
  startPicker();
}
