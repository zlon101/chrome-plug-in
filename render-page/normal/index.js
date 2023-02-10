const log = console.debug;
log('$ normal content-script');

loadStyle(chrome.runtime.getURL('render-page/normal/index.css'));

let performSearch = () => {}, HighLightElementCls;
let Vue;

(() => {
  import('../page-search.js').then(res => {
    HighLightElementCls = res.HighLightElementClass;
    performSearch = (searchText, cfg) => res.traverseDoc(searchText, cfg);
  });

  import('../../vendor/vue.esm.brower.js').then(res => {
    Vue = res.default;
  })

  import('./message.js').then(({ handleOpenSearchBox }) => {
    handleOpenSearchBox(renderSearchDialog);
  });
})();

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


const SearchWarpCls = 'zl_search_warp';
const SearchInputCls = 'zl_search_text';
const CurrentSelectCls = 'zl_search_selected'
//#de7100

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
        this.searchResult = performSearch(this.searchText, Object.keys(this.$data).reduce((acc, k) => {
          acc[k] = this.$data[k];
          return acc;
        }, {}));
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
          selectDom.querySelector(`.${HighLightElementCls}`).classList.add(CurrentSelectCls);
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

function drag(dragEle, container) {
  dragEle.setAttribute('draggable', 'true');
  const { width: oriWidth, height: oriHeight, border: oriBorder } = window.getComputedStyle(dragEle);
  dragEle.style.width = oriWidth;
  // dragEle.style.height = oriHeight;

  const onDragstart = (ev) => {
    ev.currentTarget.style.border = '2px dashed green';
    ev.effectAllowed = "move";

    const { top, left } = dragEle.getBoundingClientRect();
    const { clientX, clientY } = ev;
    ev.dataTransfer.setData('json', JSON.stringify({
      top: top - clientY,
      left: left - clientX,
    }));
  }
  const onDragend = (ev) => {
    ev.dataTransfer.clearData();
  }

  const onDragover = (ev) => {
    ev.dataTransfer.dropEffect = "move";
    ev.preventDefault();
  }

  const onDrop = (ev) => {
    const { clientX, clientY } = ev;
    const offset = JSON.parse(ev.dataTransfer.getData('json'));
    const afterLeft = Math.round(clientX + offset.left) + 'px';
    const afterTop = Math.round(clientY + offset.top) + 'px';

    dragEle.style.border = oriBorder;
    dragEle.style.top = afterTop;
    dragEle.style.left = afterLeft;
    ev.preventDefault();
  }

  dragEle.addEventListener('dragstart', onDragstart);
  dragEle.addEventListener('dragend', onDragend);
  container.addEventListener('dragover', onDragover);
  container.addEventListener('drop', onDrop);
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