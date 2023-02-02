import { Log, ChromeStorage } from '../util/index.js';
import { getParam, searchHouse } from '../render-page/house-dep/communicate.js';
import { invokSearch } from '../render-page/talent-net/send-msg.js';
import Vue from '../vendor/vue.esm.brower.js';
import {SearchFields, SearchFieldKeys, FilterParamKey} from './filter-cfg.js';

Log('popup render');

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
    const childs = FieldKeys.map(k => {
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
            change(event) {
              this.onChange(event.target);
            },
          },
        }),
      ])
    });

    // 执行按钮
    childs.push(h('button', {
      attrs: { id: 'startup' },
      on: {
        click() {
          this.onSubmit();
        }
      }
    }, '执行'));

    return h('div', {
      class: 'form',
      attrs: { id: 'vue_root' },
    }, childs);
  },
  methods: {
    setForm(k, val) {
      Log(`setForm k: ${k} val:`, val);
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
      Log('change 事件,', val);
    },
    onSubmit() {
      ChromeStorage.set(this.formVal);
      sendReques(this.formVal);
    },
  },
  beforeDestroy() {
    ChromeStorage.set({ [FilterParamKey]: this.formVal });
  },
});


let sendReques = () => console.error('sendReques 未赋值');
const currentTab = await getCurrentTab();
const curPageTitle = currentTab?.title;
if (curPageTitle.includes('住建蓉')) {
  sendReques = searchHouse;

  vueInstance.hasSearchText = false;
  vueInstance.hasFilter = true;
  getParam().then(param => {
    const keys = Object.keys(param);
    keys.forEach(k => {
      vueInstance.setForm(k, param[k]);
      /***
      const el = document.querySelector(`input#${k}`);
      if (!el) return;
      const attr = el.type === 'checkbox' ? 'checked' : 'value';
      el[attr] = param[k];**/
    });
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