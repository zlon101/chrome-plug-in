import { Log, ChromeStorage } from '../util/index.js';
import { getParam, searchHouse } from '../render-page/house-dep/communicate.js';
import { invokSearch } from '../render-page/talent-net/send-msg.js';

Log('popup render');

const inputEles = Array.from(document.querySelectorAll('input'));
const btnSubmit = document.querySelector('#startup');
let sendReques = () => console.error('sendReques 未赋值');

btnSubmit.onclick = () => {
  const form = inputEles.reduce((acc, ele) => {
    const k = ele.id;
    const val = ele.type === 'checkbox' ? ele.checked : ele.value.trim();
    acc[k] = val;
    return acc;
  }, {});

  form.isRun = true;
  ChromeStorage.set(form);
  sendReques(form);
};

inputEles.forEach(el => {
  if (el.type !== 'checkbox') return;
  el.onclick = () => {
    const k = el.id;
    const val = el.checked;
    ChromeStorage.set({ [k]: val });
  };
});


const currentTab = await getCurrentTab();
const curPageTitle = currentTab?.title;
if (curPageTitle.includes('住建蓉')) {
  sendReques = searchHouse;
  document.querySelector('.filter_more').style.display = 'block';

  getParam().then(param => {
    const keys = Object.keys(param);
    keys.forEach(k => {
      const el = document.querySelector(`input#${k}`);
      if (!el) return;
      const attr = el.type === 'checkbox' ? 'checked' : 'value';
      el[attr] = param[k];
    });
  });
} else if (curPageTitle.includes('住房和城乡建设')) {
  sendReques = invokSearch;
}


async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}