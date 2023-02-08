console.clear();

const log = console.debug;
log('$ normal content-script');

renderSearchDialog();

document.addEventListener('keydown', e => {
  // cmd+shift+f
  if (e.shiftKey && e.metaKey && (e.key === 'f' || e.keyCode === 70)) {
    renderSearchDialog();
  }
});


let performSearch = () => {};
(async () => {
  const { traverseDoc } = await import('../page-search.js');
  performSearch = (searchText, cfg) => traverseDoc(searchText, cfg);
})();

async function renderSearchDialog() {
  loadStyle(chrome.runtime.getURL('render-page/normal/index.css'));

  const { default: Vue } = await import('../../vendor/vue.esm.brower.js');
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
          class: 'zl_search_text',
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
        setAttrs({ id:'zl_search_warp' }),
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
      setTimeout(()=>this.$el.querySelector('input.zl_search_text').focus(), 500);
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