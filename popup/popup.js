import { Log, ChromeStorage, sendToCtxJs } from '../util/index.js';

let renderPageUrl = ''; // 当前页面
ChromeStorage.get(null).then(cfg => {
  renderPageUrl = cfg.NowPageUrl;
  setDomAttr(cfg);
});

const inputEles = Array.from(document.querySelectorAll('input'));
const btnSubmit = document.querySelector('#startup');
btnSubmit.onclick = () => {
  const form = inputEles.reduce((acc, ele) => {
    const k = ele.id;
    const val = ele.type === 'checkbox' ? ele.checked : ele.value.trim();
    acc[k] = val;
    return acc;
  }, {});

  form.isActive = true;
  ChromeStorage.set(form);
  // 发送给 content-js
  sendToCtxJs({
    url: renderPageUrl,
    data: { type: 'StartParse', data: form },
   });
};

inputEles.forEach(el => {
  if (el.type !== 'checkbox') return;
  el.onclick = () => {
    const k = el.id;
    const val = el.checked;
    ChromeStorage.set({ [k]: val });
  };
});

function setDomAttr(cfg) {
  const keys = Object.keys(cfg);
  keys.forEach(k => {
    const el = document.querySelector(`input#${k}`);
    if (!el) return;
    const attr = el.type === 'checkbox' ? 'checked' : 'value';
    el[attr] = cfg[k];
  });
}
