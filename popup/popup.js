import { Log, ChromeStorage } from '../util/index.js';
import { getFilterParam, searchHouse } from '../render-page/house-dep/communicate.js';
import { invokSearch } from '../render-page/talent-net/send-msg.js';
import Vue from '../vendor/vue.esm.brower.js';
import {SearchFields, SearchFieldKeys, getSearchVla, cacheSearchVal} from './filter-cfg.js';

const SearchTextKey = SearchFields.searchText.key;

const vueInstance = new Vue({
  el: '#vue_root',
  data: {
    hasSearchText: true,
    hasFilter: false,
    formVal: {},
  },
  render(h) {
    let FieldKeys = [];
    if (this.hasSearchText) {
      FieldKeys = [SearchTextKey]
    }
    if (this.hasFilter) {
      FieldKeys = [...FieldKeys, ...SearchFieldKeys.filter(k => k !== SearchTextKey)];
    }
    const fields = FieldKeys.map(k => {
      const field = SearchFields[k];
      return h('div', {
        class: 'field',
      }, [
        h('span', field.label+':'),
        h('input', {
          attrs: {
            type: field.type || 'text',
            id: field.key,
            placeholder: field.place || field.label,
          },
          on: {
            change: e => this.onChange(e.target),
          },
        }),
      ])
    });

    // 按钮
    const btnExe = h('button', {
      attrs: { id: 'startup' },
      on: {
        click: this.onSubmit
      }
    }, '执行');

    const btnClear = h('button', {
      on: { click: ChromeStorage.clear },
    }, 'clear');

    const buttons = h('div', {
      class: 'btn_wrap',
    }, [btnExe, btnClear]);

    return h('div', {
      class: 'form',
      attrs: { id: 'vue_root' },
    }, [...fields, buttons]);
  },
  methods: {
    setForm(k, val) {
      this.formVal[k] = val;

      const el = this.$el.querySelector(`input#${k}`);
      if (!el) return;
      const attr = el.type === 'checkbox' ? 'checked' : 'value';
      el[attr] = val;
    },
    onChange(ele) {
      const val = ele.type === 'checkbox' ? ele.checked : ele.value.trim();
      const key = ele.id;
      this.formVal[key] = val;
      cacheSearchVal(this.formVal);
    },
    onSubmit() {
      ChromeStorage.set(this.formVal);
      sendReques(this.formVal);
    },
  },
});


window.onload = () => Log('onload');

let sendReques = () => console.error('sendReques 未赋值');
const currentTab = await getCurrentTab();
const curPageTitle = currentTab?.title;

if (curPageTitle.includes('住建蓉')) {
  sendReques = searchHouse;
  vueInstance.hasSearchText = false;
  vueInstance.hasFilter = true;

  const pageParam = await getFilterParam() || {};
  const cacheParam = await getSearchVla() || {};
  const totalParam = { ...cacheParam, ...pageParam };
  Object.keys(totalParam).forEach(k => {
    !totalParam[k] && (totalParam[k] = pageParam[k] || cacheParam[k]);
  })
  console.debug(`
    pageParam: %o
    cacheParam: %o
    total: %o
  `, pageParam, cacheParam, totalParam);

  const keys = Object.keys(totalParam);
  keys.forEach(k => {
    totalParam[k] && vueInstance.setForm(k, totalParam[k]);
    /***
     const el = document.querySelector(`input#${k}`);
     if (!el) return;
     const attr = el.type === 'checkbox' ? 'checked' : 'value';
     el[attr] = totalParam[k]; **/
  });

} else if (curPageTitle.includes('住房和城乡建设')) {
  vueInstance.hasSearchText = true;
  vueInstance.hasFilter = false;
  sendReques = invokSearch;
}


async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
const inputEles = Array.from(document.querySelectorAll('input'));
const btnSubmit = document.querySelector('#startup');

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
 **/