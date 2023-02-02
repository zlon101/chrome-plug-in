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
    return chrome.storage.local.remove(k);
  },
  clear() {
    chrome.storage.local.clear().then(() => alert('清除成功')).catch(e => alert('清除失败'));
  },
};
