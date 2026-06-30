const HighlightCls = 'zl_picker_highlight';
const OverlayCls = 'zl_picker_overlay';

const PROTECTED_TAGS = new Set(['HTML', 'BODY', 'HEAD']);

const EXTENSION_OWNED_IDS = new Set(['zl_search_warp', 'zl-picker-style']);

export function isExtensionElement(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
  if (el.classList?.contains(OverlayCls)) return true;
  if (EXTENSION_OWNED_IDS.has(el.id)) return true;
  return el.closest(`#zl_search_warp, .${OverlayCls}`) != null;
}

export function safeRemove(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  if (PROTECTED_TAGS.has(el.tagName) || el === document.documentElement) return false;
  if (isExtensionElement(el)) return false;

  el.classList.remove(HighlightCls);
  el.remove();
  return true;
}

export function canHighlight(el) {
  return el && !PROTECTED_TAGS.has(el.tagName) && el !== document.documentElement && !isExtensionElement(el);
}
