// 通过控制台 DevTools $0 获取元素选择器
// 用户流程:
// 1. 点击 Popup "控制台选元素" 按钮
// 2. 在 DevTools Elements 面板选中目标元素
// 3. 在控制台运行: copy(__getSelector($0))

function generateSelector(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;

  if (el.id) {
    const selector = `#${el.id}`;
    if (document.querySelectorAll(selector).length === 1) return selector;
  }

  const parts = [];
  let current = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c && !/[^a-zA-Z0-9_-]/.test(c));
      if (classes.length > 0) {
        const classSelector = selector + '.' + classes.join('.');
        const candidates = current.parentElement
          ? Array.from(current.parentElement.querySelectorAll(classSelector))
          : [];
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
    if (matched.length === 1 && matched[0] === el) return fullSelector;
  } catch (_) {}

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

// 暴露到 window 供控制台调用
window.__getSelector = function(el) {
  const target = el || window.$0;
  if (!target) {
    console.warn('%c[选元素] 未在 DevTools 中选中任何元素，请先在 Elements 面板点击选中目标', 'color:#ffa500;font-size:13px');
    return null;
  }
  const selector = generateSelector(target);
  if (selector) {
    console.log(`%c[选元素] 选择器: %c${selector}`, 'color:#7ec699;', 'color:#fff;background:#333;padding:2px 6px;border-radius:3px;');
    console.log('%c提示: 使用 copy(__getSelector($0)) 复制到剪贴板', 'color:#888;font-size:12px;');
  }
  return selector;
};
