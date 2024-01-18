export const log = (label, data, type = 'debug') => {
  const Color = {
    info: 'color: #fff',
    debug: 'color: #0af4f4',
    warn: 'color: #f4f40a',
    error: 'color: red'
  }
  const msg = ['undefined', 'object'].includes(typeof data) ? JSON.stringify(data, null ,2) : data;
  console.debug(`\n%c${label}:\n  ${msg}`, Color[type]);
};

export function drag(dragEle, container) {
  dragEle.setAttribute('draggable', 'true');
  const { width: oriWidth, height: oriHeight, border: oriBorder } = window.getComputedStyle(dragEle);
  // dragEle.style.width = oriWidth;
  // dragEle.style.height = oriHeight;

  const onDragstart = (ev) => {
    ev.currentTarget.style.border = '2px dashed green';
    ev.effectAllowed = "move";

    const { top, left } = dragEle.getBoundingClientRect();
    const { clientX, clientY } = ev;
    ev.dataTransfer.setData('json', JSON.stringify({
      top: top - clientY,
      left: left - clientX,
    }));
  }
  const onDragend = (ev) => {
    ev.dataTransfer.clearData();
  }

  const onDragover = (ev) => {
    ev.dataTransfer.dropEffect = "move";
    ev.preventDefault();
  }

  const onDrop = (ev) => {
    const { clientX, clientY } = ev;
    const offset = JSON.parse(ev.dataTransfer.getData('json'));
    const afterLeft = clientX + offset.left;
    const afterRight = Math.round(document.body.clientWidth - afterLeft - dragEle.offsetWidth);
    const afterTop = Math.round(clientY + offset.top);

    dragEle.style.border = oriBorder;
    dragEle.style.top = afterTop + 'px';
    dragEle.style.right = afterRight + 'px';
    ev.preventDefault();
  }

  dragEle.addEventListener('dragstart', onDragstart);
  dragEle.addEventListener('dragend', onDragend);
  container.addEventListener('dragover', onDragover);
  container.addEventListener('drop', onDrop);
}

// 动态样式
export function loadStyle(url) {
  const link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  const head = document.getElementsByTagName('head')[0];
  head.appendChild(link);
}

function isHideElement(element) {
  if (!element || element.offsetHeight < 2 || element.offsetWidth < 2) {
    return true;
  }
  let hide = false;
  if (typeof element.checkVisibility === 'function') {
    return !element.checkVisibility({
      checkOpacity: true,      // Check CSS opacity property too
      checkVisibilityCSS: true // Check CSS visibility property too
    });
  }
  const styleAttr = window.getComputedStyle(element);
  return styleAttr.display === 'none' || styleAttr.visibility === 'hidden' || styleAttr.opacity === '0';
}

export function isHideNode(node) {
  // Element
  if (node.nodeType === 1) {
    return isHideElement(node);
  }
  // Text
  if (node.nodeType === 3) {
    return isHideElement(node.parentElement)
  }
  return false;
}
