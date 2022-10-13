// 住建-租售公告

console.clear();
const href = window.location.href;
new RegExp('高新', 'i');

setup();


async function setup () {
  const targetUrl = 'http://cdzj.chengdu.gov.cn/cdzj/rcajzsgg/RCAJ_list';
  if (!href.includes(targetUrl)) {
    return;
  }
  const { Storager, ChromeStorage, regMsgListener } = await import('../util/index.js');

  // 注册监听
  regMsgListener((request, sender) => {
    const ExtendId = 'dmpmcohcnfkhemdccjefninlcelpbpnl';
    if (sender.id !== ExtendId) return;

    const reqType = request.type;
    if (reqType === 'StartParse') {
      Storager.set('notRedirect', false);
      Storager.set('couldRun', true);
      exe();
    }
  });
  ChromeStorage.set({ NowPageUrl: `${targetUrl}*`});

  Storager.get('couldRun') && exe();
  async function exe() {
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

    const preVal = Storager.get('bpw5t5') || [];
    console.log({ totalPage, nowPage });

    // 定位到首页
    if (nowPage !== 1 && !Storager.get('notRedirect')) {
      Storager.set('notRedirect', true)
      Storager.set('bpw5t5', []);
      $pagination.firstElementChild.click();
      return;
    }

    const searchVal = await ChromeStorage.get('searchVal') || '.*';
    console.debug({ searchVal });
    const targetReg = new RegExp(searchVal);
    const res = parsePage(targetReg);
    // console.debug(res);

    if (nowPage !== totalPage) {
      Storager.set('bpw5t5', preVal.concat(res));
      $nextPage.click();
    } else {
      // 完成所有页面遍历
      Storager.set('notRedirect', false);
      Storager.set('couldRun', false);
      Storager.set('bpw5t5', []);
      rendDialog(preVal.concat(res));
    }
  };
}

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
  const { default: Vue } = await import('../util/vue.esm.brower.js');
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
