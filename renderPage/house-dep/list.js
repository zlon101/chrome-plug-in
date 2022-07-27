import { parseTable } from '../tool.js';
import { Log, Storager, ChromeStorage, getNow, regMsgListener, sendMeg } from '../../util/index.js';

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
  proName: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtpName'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  proId: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtpId'),
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
      return +this.el.textContent.trim();
    },
    set(val) {
      this.el.value = val;
    },
  },
  totalPageNum: {
    el: document.getElementById('ID_ucSCXXShowNew2_UcPager1_lbPageCount'),
    get() {
      return +this.el.textContent.replace(/\D/g, '');
    },
  },
  getTableVal: () => parseTable('table#ID_ucSCXXShowNew2_gridView'),
  // 修改搜索参数后刷新页面
  submitSearch: () => document.getElementById('ID_ucSCXXShowNew2_btnSccx').click(),
  prePage: () => document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewLast').click(),
  nextPage: () => document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewNext').click(),
  toFirstPage: () => {
    document.getElementById('ID_ucSCXXShowNew2_UcPager1_txtPage').value = 1;
    document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnPageSubmit').click();
  },
};

// 列表页
export async function handleIndexPage() {
  let addDetailInfo = () => {};
  // 接收来自详情页的消息
  window.addEventListener('message', e => {
    if (e.origin !== Origin) return;
    const eData = e.data;
    if (eData.type === 'DetailInfo') {
      addDetailInfo(eData);
    }
  });

  const indexPageRes = await parseIndexPage();
  if (!indexPageRes) return;
  addDetailInfo = indexPageRes.updateDetailCol;

  regMsgListener((request, sender, sendResponse) => {
    const ExtendId = 'dmpmcohcnfkhemdccjefninlcelpbpnl';
    if (sender.id !== ExtendId) return;

    const reqType = request.type;
    if (reqType === 'UpdateSearch') {
      // 来自popup的消息, 更新筛选参数
      parseIndexPage(request.data).then(indexPageRes2 => {
        Log('来自popup的消息, 更新筛选参数');
        if (indexPageRes2) {
          addDetailInfo = indexPageRes2.updateDetailCol;
        }
      });
    } else if (reqType === 'OptionRende') {
      // 选项页打开，发送数据给选项页
      const indexPage = Storager.get('pageStorage');
      sendResponse(indexPage);
    }
  });
}

/**
插件配置
extCfg: {
  proId
  proName
  area: '双流区',
  startDate: '2022-05-16',
  endDate: '2022-08-16',
  isParseDetail: true,
};
*/
const SearchField = ['area', 'startDate', 'endDate', 'proName', 'proId'];
async function parseIndexPage(popupForm) {
  const isForbidExtension = await ChromeStorage.get('isForbid');
  if (isForbidExtension) return;
  // 获取页面参数
  const pageInfo = {};
  pageInfo.title = document.title;
  pageInfo.parseTime = getNow();
  Object.keys(PageCfg).forEach(k => {
    if (typeof PageCfg[k].get === 'function') {
      pageInfo[k] = PageCfg[k].get();
    }
  });
  Log('pageInfo:', pageInfo);
  // 定位到第一页
  const isRended = Storager.get('isRended');
  if (!isRended && (+pageInfo.curPageNum) !== 1) {
    PageCfg.toFirstPage();
    return;
  }
  // 确定预期的参数
  const preExtCfg = await ChromeStorage.get(null);
  let extCfg = { ...preExtCfg, ...popupForm };
  console.log('\npopupForm:%o\npreExtCfg:%o', popupForm, preExtCfg);
  if (!popupForm && isRended) {
    SearchField.forEach(k => (extCfg[k] = pageInfo[k]));
  }
  ChromeStorage.set(extCfg);
  Storager.set('isRended', true);

  // 是否需要修改页面参数
  const searchParam = {};
  let isTargetSearchVa = true;
  SearchField.forEach(k => {
    searchParam[k] = extCfg[k];
    if (extCfg.hasOwnProperty(k) && extCfg[k] !== pageInfo[k]) {
      PageCfg[k].set(searchParam[k]);
      isTargetSearchVa = false;
    }
  });
  if (!isTargetSearchVa) {
    // 刷新页面
    PageCfg.submitSearch();
    return;
  }

  // 解析表格
  const tableInfo = PageCfg.getTableVal(); // { header, dataRow: [[col], [col]] }
  const filterCb = row => row[4].includes('住宅');
  tableInfo.dataRow = tableInfo.dataRow.filter(row => filterCb(row));
  Log(`数据行: ${tableInfo.dataRow.length}`);

  const detailUrlIdx = {};
  tableInfo.dataRow.forEach((row, rIdx) => {
    const detailHref = row[row.length - 1];
    detailUrlIdx[detailHref] = rIdx;
  });

  
  // 当前table处理完成, 继续下一页
  const completeCb = () => {
    Storager.append('tableRow', tableInfo.dataRow);
    if (pageInfo.curPageNum === pageInfo.totalPageNum) {
      const data = { pageInfo, tableInfo };
      tableInfo.dataRow = Storager.get('tableRow');
      Storager.set('pageStorage', data);
      sendMeg(data); // 发送给选项页
      Storager.remove('tableRow');
    } else {
      // 下一页
      PageCfg.nextPage();
    }
  };
  // 打开详情页
  if (extCfg.isParseDetail) {
    setTimeout(() => {
      tableInfo.dataRow.forEach(row => {
        const detailUrl = row[row.length - 1];
        const targetW = window.open(detailUrl, '_blank');
        // setTimeout(() => targetW.postMessage('列表页发送给详情页', Origin), 2000);
      });
    });
  } else {
    completeCb();
  }

  // 添加详情信息
  let count = 0;
  return {
    pageInfo,
    tableInfo,
    updateDetailCol: detail => {
      ++count;
      // Log('添加详情信息\n', detail);
      const rIdx = detailUrlIdx[detail.url];
      const curRow = tableInfo.dataRow[rIdx];
      curRow[curRow.length - 1] = detail;
      if (count === tableInfo.dataRow.length) {
        completeCb();
      }
    },
  };
}
