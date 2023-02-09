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
    performSearch('');
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
  // renderSearchDialog();
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
      searchResult: [],
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

      const _searchResult = this.searchResult;
      const details = _searchResult.length > 0 && h('details',
        {
          class: 'zl_search_detail',
        },
        [
          h('summary', `搜索到 ${_searchResult.length} 项`),
          h('div', _searchResult.map((item, ind) => {
            return h('div', {
              class: 'zl_search_result_item',
              style: '',
              domProps: { innerHTML: `${ind+1}. ${item.innerHtml}` },
              on: {
                click: () => {
                  const targetDom = document.querySelector(`.${item.cls}`);
                  if (targetDom) {
                    targetDom.scrollIntoView({behavior: 'smooth', block: 'center'});
                  }
                }
              }
            });
          })),
        ]
      );

      return h('div',
        setAttrs({ id: SearchWarpCls }),
        [
          h('div', {class: 'btns'}, btnChilds),
          closeBtn,
          inputText,
          details,
        ]
      );
    },
    methods: {
      onSearch() {
        const matchElements = performSearch(this.searchText, Object.keys(this.$data).reduce((acc, k) => {
          acc[k] = this.$data[k];
          return acc;
        }, {}));
        this.searchResult = matchElements;
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