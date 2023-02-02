console.clear();
(async function () {
  const {listenExtend, TalentListPage} = await import('./send-msg.js');
  const { Storager } = await import('../../util/index.js');

  if (TalentListPage === document.title) {
    listenExtend(callSearch);
    Storager.get('couldRun') && callSearch();
  }


  async function callSearch(searchVal) {
    const pageTextContent = document.querySelector('.pagination-last').textContent;
    const totalPage = parseInt(pageTextContent.match(/共\s*(\d+)\s*页/)[1]);
    const nowPage = parseInt(pageTextContent.match(/当前第\s*(\d+)/)[1]);
    const $pagination = document.querySelector('.pagination-first');
    let $nextPage = null
    for (let el of $pagination.children) {
      if (el.textContent.includes('下一页')) {
        $nextPage = el;
        break;
      }
    }

    // 定位到首页
    if (nowPage !== 1 && !Storager.get('notRedirect')) {
      Storager.set('notRedirect', true)
      Storager.set('bpw5t5', []);
      $pagination.firstElementChild.click();
      return;
    }
    if (searchVal) {
      Storager.set('xdsa', searchVal);
    } else {
      searchVal = Storager.get('xdsa');
    }
    if (!searchVal) {
      console.error('searchVal 为空');
      return;
    }
    Storager.set('couldRun', true);
    const targetReg = new RegExp(searchVal);
    const preVal = Storager.get('bpw5t5') || [];
    const totalVal = preVal.concat(parsePage(targetReg));
    if (nowPage !== totalPage) {
      Storager.set('bpw5t5', totalVal);
      $nextPage.click();
    } else {
      // 完成所有页面遍历
      Storager.set('notRedirect', false);
      Storager.set('couldRun', false);
      Storager.set('bpw5t5', []);
      console.debug(`
        搜索【${searchVal}】完成
        共 ${totalPage} 页，当前 ${nowPage} 页
        找到 ${totalVal.length} 条数据
      `);
      rendDialog(totalVal);
    }
  }
})();

function parsePage (reg) {
  const $table = document.getElementById('ID_ucShowRCAJList_UcNewsListPager1_listArt');
  const trArr = Array.from($table.querySelectorAll('tbody tr'));
  let trTxt = '';
  const result = [];
  trArr.forEach($tr => {
    trTxt = $tr.textContent.replace(/\n\s*/g, ' ');
    if (reg.test(trTxt)) {
      result.push({
        txt: trTxt,
        url: $tr.querySelector('a').getAttribute('href'),
      });
    }
  })
  return result;
}

async function rendDialog(list) {
  await import('../../vendor/evalCore.min.js');
  const { default: Vue } = await import('../../vendor/vue.esm.brower.js');
  const app = new Vue({
    template: `<div class="dialog" :style="wrapSty">
      <button :style="closeSty" @click="onClose">关闭</button>
      <ol :style="ulSty"><li v-for="item in list" :key="item.url" :style="liSty"><a :href="item.url">{{item.txt}}</a></li></ol>
      <div v-if="!list || !list.length" :style="empty">无数据</div
    </div>`,
    methods: {
      onClose() {
        this.$destroy();
        this.$el.remove();
      },
    },
    data() {
      return {
        list,
        wrapSty: {
          maxHeight: "90vh",
          minHeight: '40px',
          minWidth: '400px',
          overflow: 'auto',
          padding: '8px',
          border: '2px solid blue',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          position: 'absolute',
          left: '50%',
          top: '50px',
          transform: 'translateX(-50%)'
        },
        closeSty: {
          position: 'absolute',
          right: 0,
          top: 0,
        },
        ulSty: {
          // listStyle: 'none',
        },
        liSty: {
          whiteSpace: 'nowrap',
          margin: '8px 8px 8px 16px',
          textDecoration: 'underline',
        },
        empty: {
          color: 'red',
        },
      };
    },
  });
  document.body.appendChild(app.$mount().$el);
}
