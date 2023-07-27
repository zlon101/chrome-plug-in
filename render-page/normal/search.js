import { loadStyle, drag } from '../../util/tool.js';
import { HighLightElementClass, traverseDoc } from '../page-search.js';

const log = console.debug;
const performSearch = (searchText, cfg) => {
  const a = Date.now();
  traverseDoc(searchText, cfg);
  log(`\n\n=== 搜索结束，耗时: ${(Date.now() - a) / 1000} ===`);
};

const SearchWarpCls = 'zl_search_warp';
const SearchInputCls = 'zl_search_text';
const CurrentSelectCls = 'zl_search_selected';
//#de7100

loadStyle(chrome.runtime.getURL('render-page/normal/index.css'));

document.addEventListener('keydown', e => {
  // cmd+shift+f
  if (e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === 'f' || e.keyCode === 70)) {
    return renderSearchDialog();
  }
  if (e.key === 'Escape' || e.keyCode === 27) {
    const wrapDom = document.querySelector(`#${SearchWarpCls}`);
    wrapDom && wrapDom.querySelector('.zl_search_close').click();
    performSearch('');
  }
});

export function renderSearchDialog() {
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

  const vueInstance = new window.Vue({
    data: {
      isCase: true,
      isAllMatch: false,
      searchText: '',
      color: '#87c48e',
      searchResult: null,
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
                setTimeout(this.onSearch);
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
              const { key, keyCode } = e;
              if (key === 'Enter' || keyCode === 13) {
                this.onSearch();
              } else if (key === 'ArrowUp' || keyCode === '38') {
                this.onSelectResult('up');
                e.preventDefault();
              } else if (key === 'ArrowDown' || keyCode === '40') {
                this.onSelectResult('down');
                e.preventDefault();
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
            performSearch('');
          }
        }
      }, 'X');

      const _searchResult = this.searchResult;
      const details = _searchResult && h('details',
        {
          class: 'zl_search_detail',
        },
        [
          h('summary', `搜索到 ${_searchResult.length} 项`),
          h('div', _searchResult.map((item, ind) => {
            return h('div', {
              class: 'zl_search_result_item',
              domProps: { innerHTML: `${ind+1}. ${item.innerHtml}` },
              on: {
                click: () => this.onSelectResult('', ind)
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
        this.searchResult = [];
        setTimeout(() => {
          this.searchResult = performSearch(this.searchText, Object.keys(this.$data).reduce((acc, k) => {
            acc[k] = this.$data[k];
            return acc;
          }, {}));
        });
      },
      // 聚焦到上/下一个搜索项
      onSelectResult(upOrDown, index) {
        const N = this.searchResult.length;
        if(!N) return;

        // 清除已有的元素样式
        for (const _ele of document.querySelectorAll(`.${CurrentSelectCls}`)) {
          _ele.classList.remove(CurrentSelectCls);
        }

        let nextSelectIndex = 0;
        const lastIndex = this.selectedItemIndex
        if (typeof index === 'number') {
          nextSelectIndex = index;
        } else {
          const isUp = upOrDown === 'up';
          if (lastIndex === 0 && isUp) {
            nextSelectIndex = N -1;
          } else if (lastIndex === N - 1 && !isUp) {
            nextSelectIndex = 0;
          } else {
            nextSelectIndex = typeof lastIndex === 'number' ? (lastIndex + (isUp ? -1 : 1)) : 0;
            nextSelectIndex = Math.max(Math.min(nextSelectIndex, N - 1), 0);
          }
        }
        this.selectedItemIndex = nextSelectIndex;

        const selectDom = document.querySelector('.'+this.searchResult[nextSelectIndex].cls);
        if (selectDom) {
          selectDom.scrollIntoView({behavior: 'smooth', block: 'center'});
          selectDom.querySelector(`.${HighLightElementClass}`).classList.add(CurrentSelectCls);
        } else {
          console.error('onSelectResult 未找到对应元素');
        }
      },
    },

    mounted() {
      setTimeout(()=>{
        drag(this.$el, document.body);
        this.$el.querySelector(`input.${SearchInputCls}`).focus();
      }, 500);
    },
  });

  document.body.appendChild(vueInstance.$mount().$el);
}
