export const Log = (...args) => console.log('\n🔥', ...args);

export const Storage = {
  set(k, v, type = 'session') {
    const str = typeof v === 'object' ? JSON.stringify(v) : v;
    if (type === 'session') {
      sessionStorage.setItem(k, str);
    } else {
      localStorage.setItem(k, str);
    }
  },
  get(k, type = 'session') {
    if (type === 'session') {
      return JSON.parse(sessionStorage.getItem(k));
    }
    return JSON.parse(localStorage.getItem(k));
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

export const getNow = () => {
  const date = new Date();
  const m = `00${date.getMonth() + 1}`.slice(-2);
  const day = `00${date.getDate()}`.slice(-2);
  const h = `00${date.getHours()}`.slice(-2);
  const min = `00${date.getMinutes()}`.slice(-2);
  return `${m}月${day}-${h}时${min}分`;
};

export const saveFile = (fileName, str) => {
  const url = window.URL || window.webkitURL || window;
  const blob = new Blob([str]);
  const saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  saveLink.href = url.createObjectURL(blob);
  saveLink.download = fileName;
  saveLink.click();
};
