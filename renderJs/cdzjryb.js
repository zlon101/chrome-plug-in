// https://zw.cdzjryb.com/SCXX/Default.aspx?action=ucSCXXShowNew2
/**
 * 搜索参数
 *   地区
 *   开始时间
 *   结束时间
 * 查询
 *
 * 当前页码
 * 总页数
 * 确定
 */

const PageCfg = {
  // 地区
  area: {
    el: document.getElementById('ID_ucSCXXShowNew2_ddlRegion'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  // 2022-06-16
  startDate: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtTime1'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  endDate: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtTime2'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  curPageNum: {
    el: document.querySelector('#ID_ucSCXXShowNew2_UcPager1_page1 .current'),
    get() {
      return this.el.textContent.trim();
    },
    set(val) {
      this.el.value = val;
    },
  },
  totalPageNum: {
    el: document.getElementById('ID_ucSCXXShowNew2_UcPager1_lbPageCount'),
    get() {
      return this.el.textContent.replace(/\D/g, '');
    },
  },
  // 修改搜索参数后刷新页面
  submitSearch: () => document.getElementById('ID_ucSCXXShowNew2_btnSccx').click(),
  prePage: () => document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewLast').click(),
  nextPage: () => document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewNext').click(),
};

// setup
// const TargetSearch = {
//   area: '双流区',
//   startDate: '2022-05-16',
//   endDate: '2022-08-16',
// };

(async () => {
  const { Log, Storage } = await import('./util.js');
  Log('inner js');

  // 更新筛选参数
  const TargetSearch = Storage.get('TargetSearch', 'local');
  const pageInfo = {};
  Object.keys(PageCfg).forEach(k => {
    if (typeof PageCfg[k].get === 'function') {
      pageInfo[k] = PageCfg[k].get();
    }
  });
  const isTargetSearchVa = Object.keys(TargetSearch).every(k => TargetSearch[k] === pageInfo[k]);
  if (!isTargetSearchVa) {
    Object.keys(TargetSearch).forEach(k => {
      PageCfg[k].set(TargetSearch[k]);
    });
    // 刷新页面
    PageCfg.submitSearch();
    return;
  }
  Log(pageInfo);

  // 解析页面数据
})();
