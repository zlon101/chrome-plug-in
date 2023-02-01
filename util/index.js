export * from './msg.js';

export const Storager = {
  set(k, v, type = 'session') {
    const str = typeof v === 'object' ? JSON.stringify(v) : v;
    if (type === 'session') {
      sessionStorage.setItem(k, str);
    } else {
      localStorage.setItem(k, str);
    }
  },
  get(k, type = 'session') {
    try {
      if (type === 'session') {
        return JSON.parse(sessionStorage.getItem(k));
      }
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      if (type === 'session') {
        return sessionStorage.getItem(k);
      }
      return localStorage.getItem(k);
    }
  },
  append(k, v, type = 'session') {
    const defaultV = Array.isArray(v) ? [] : {};
    const preVal = this.get(k, type) || defaultV;
    const nVal = Array.isArray(v) ? [...preVal, ...v] : {...preVal, ...v};
    this.set(k, nVal, type);
  },
  remove(k, type = 'session') {
    if (type === 'session') {
      sessionStorage.removeItem(k);
    } else {
      localStorage.removeItem(k);
    }
  },
};

export const ChromeStorage = {
  get(k) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(k, data => {
        resolve(k ? data[k] : data);
      });
    });
  },
  set(obj) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(obj, data => {
        resolve(data);
      });
    });
  },
  remove(k) {
    chrome.storage.local.remove(k);
  },
};

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

export const ExtendId = 'dmpmcohcnfkhemdccjefninlcelpbpnl';