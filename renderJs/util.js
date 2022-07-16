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

export const Log = (...args) => console.log('\n🔥', ...args);
