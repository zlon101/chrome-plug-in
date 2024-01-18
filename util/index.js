export * from './msg.js';
export * from './storage.js';
export * from './tool.js';

export const saveFile = (fileName, str) => {
  const url = window.URL || window.webkitURL || window;
  const blob = new Blob([str]);
  const saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  saveLink.href = url.createObjectURL(blob);
  saveLink.download = fileName;
  saveLink.click();
};

export const getNow = () => {
  const date = new Date();
  const m = `00${date.getMonth() + 1}`.slice(-2);
  const day = `00${date.getDate()}`.slice(-2);
  const h = `00${date.getHours()}`.slice(-2);
  const min = `00${date.getMinutes()}`.slice(-2);
  return `${m}月${day}-${h}时${min}分`;
};

export const Log = (...args) => console.log('\n🔥', ...args);

export const ExtendId = chrome.runtime.id;

// log('chrome.runtime.id', chrome.runtime.id);
