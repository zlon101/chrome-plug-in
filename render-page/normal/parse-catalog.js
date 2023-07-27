import { drag, isHideNode } from '../../util/tool.js';

const log = console.debug;
const ParseWrapId = 'zl_parse_catalog_warp';

// 解析页面标题目录
export function execParseCatalog() {
  let eles = document.querySelectorAll('h1,h2,h3,h4,h5,h6') || [];
  eles = [...eles].filter(el => !isHideNode(el));

  const titleEles = Array.prototype.map.call(eles, (el, _index) => {
    el.classList.add(`zl_mark_t_${_index}`);
    const level = parseInt(el.tagName.replace(/[hH]/g, ''));
    return {
      level,
      text: el.textContent.trim(),
    };
  });
  const N = titleEles.length;
  if (N > 0) {
    mounttainer(titleEles);
  } else {
    alert(`解析完成，数量${N}`);
  }
}

export function mounttainer(searchResult) {
  const wrapDom = document.querySelector(`#${ParseWrapId}`);
  if (wrapDom) {
    return;
  }

  const setAttrs = (attr) => ({ attrs: attr });

  const vueInstance = new window.Vue({
    render(h) {
      const closeBtn = h('div', {
        class: 'zl_parse_close',
        on: {
          click: () => {
            this.$destroy();
            this.$el.remove();
            // performSearch('');
          }
        }
      }, 'X');

      return h('div', setAttrs({id: ParseWrapId}),
        [
          closeBtn,
          h('ul', searchResult.map((item, ind) => {
            const innerHTML = new Array(item.level - 1).fill('&nbsp;&nbsp;&nbsp;&nbsp;').join('') + item.text;
            return h('li', {
              class: `zl_parse_t h${item.level}`,
              domProps: { innerHTML },
              on: {
                click: () => this.onFocusItem(ind),
              }
            });
          })),
        ]
      );
    },

    methods: {
      onFocusItem(index) {
        const cls = `.zl_mark_t_${index}`;
        const targetDom = document.querySelector(cls);
        targetDom && targetDom.scrollIntoView({behavior: 'smooth', block: 'center'});
      },
    },

    mounted() {
      setTimeout(()=>{
        drag(this.$el, document.body);
      }, 500);
    },
  });

  document.body.appendChild(vueInstance.$mount().$el);
}
