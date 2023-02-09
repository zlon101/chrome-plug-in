const log = console.debug;
log('$ normal content-script');

loadStyle(chrome.runtime.getURL('render-page/normal/index.css'));

document.addEventListener('keydown', e => {
  // cmd+shift+f
  if (e.shiftKey && e.metaKey && (e.key === 'f' || e.keyCode === 70)) {
    return renderSearchDialog();
  }
  if (e.key === 'Escape' || e.keyCode === 27) {
    const wrapDom = document.querySelector(`#${SearchWarpCls}`);
    wrapDom && wrapDom.querySelector('.zl_search_close').click();
  }
});

let performSearch = () => {};
(async () => {
  const { traverseDoc } = await import('../page-search.js');
  performSearch = (searchText, cfg) => traverseDoc(searchText, cfg);
})();

let Vue = null;
(async () => {
  const { default: _Vue } = await import('../../vendor/vue.esm.brower.js');
  Vue = _Vue;
})();


const SearchWarpCls = 'zl_search_warp';
const SearchInputCls = 'zl_search_text';

function renderSearchDialog() {
  const wrapDom = document.querySelector(`#${SearchWarpCls}`);
  if (wrapDom) {
    wrapDom.querySelector(`.${SearchInputCls}`).focus();
    return;
  }
  const BtnCfg = [{
    id: 'isCase',
    label: '大小写',
  }, {
    id: 'isAllMatch',
    label: '全匹配',
  }, {
    id: 'color',
    label: '颜色',
    type: 'text',
  }];

  const setAttrs = (attr) => ({ attrs: attr });

  const vueInstance = new Vue({
    data: {
      isCase: true,
      isAllMatch: false,
      searchText: '',
      color: 'red',
    },
    render(h) {
      const btnChilds = BtnCfg.map(item => h('label',
        setAttrs({ id: item.id }),
        [
          h('span', item.label),
          h('input', {
            ...setAttrs({ type: item.type || 'checkbox', checked: this.$data[item.id] }),
            on: {
              change: e => {
                this.$data[item.id] = item.type === 'text' ? e.target.value.trim() : e.target.checked;
                this.onSearch();
              }
            }
          })
        ]
        )
      );

      const inputText = h('input',
        {
          ...setAttrs({type: 'text'}),
          domProps: {
            value: this.searchText,
          },
          class: SearchInputCls,
          on: {
            input: e => (this.searchText = e.target.value),
            keydown: e => {
              if (e.key === 'Enter' || e.keyCode === 13) {
                this.onSearch();
              }
            },
          }
        }
      );

      const closeBtn = h('div', {
        class: 'zl_search_close',
        on: {
          click: () => {
            this.$destroy();
            this.$el.remove();
          }
        }
      }, 'X');

      return h('div',
        setAttrs({ id: SearchWarpCls }),
        [
          h('div', {class: 'btns'}, btnChilds),
          inputText,
          closeBtn,
        ]
      );
    },
    methods: {
      onSearch() {
        performSearch(this.searchText, Object.keys(this.$data).reduce((acc, k) => {
          acc[k] = this.$data[k];
          return acc;
        }, {}));
      },
    },
    mounted() {
      setTimeout(()=>this.$el.querySelector(`input.${SearchInputCls}`).focus(), 500);
    },
  });

  document.body.appendChild(vueInstance.$mount().$el);
}

// 动态样式
function loadStyle(url) {
  const link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  const head = document.getElementsByTagName('head')[0];
  head.appendChild(link);
}