import { parseTable, dialog } from './tool.js';
import {
  Log,
  ExtendId,
  Storager,
  ChromeStorage,
  getNow,
  regMsgListener,
  sendMsgToExtension,
} from '../../util/index.js';
import { MsgType, Runing, noticePage } from './communicate.js';
import { SearchFields } from '../../popup/filter-cfg.js';

const IsRendedKey = '是否已经重定向到首页',
  SearchResultKey = '筛选结果',
  SearchField = [SearchFields.area, SearchFields.startDate, SearchFields.endDate, SearchFields.proName, SearchFields.proId].map(item => item.key),
  PopupParamKey = 'PopupParam';

// 页面筛选参数
const PageCfg = {
  // 地区
  [SearchFields.area.key]: {
    el: document.getElementById('ID_ucSCXXShowNew2_ddlRegion'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  // 2022-06-16
  [SearchFields.startDate.key]: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtTime1'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  [SearchFields.endDate.key]: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtTime2'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  [SearchFields.proName.key]: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtpName'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  [SearchFields.proId.key]: {
    el: document.getElementById('ID_ucSCXXShowNew2_txtpId'),
    get() {
      return this.el.value;
    },
    set(val) {
      this.el.value = val;
    },
  },
  curPageNum: {
    // el: document.querySelector('#ID_ucSCXXShowNew2_UcPager1_page1 .current'),
    el:document.querySelector('#ID_ucSCXXShowNew2_UcPager1_txtPage'),
    get() {
      const val = Number(this.el.value.trim());
      console.debug('当前页码', val);
      if (Number.isNaN(val)) {
        throw new Error('curPageNum.get() 为 NaN');
      }
      return val;
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
  submitSearch: noticePage.reload,
  prePage: noticePage.prePage,
  nextPage: noticePage.nextPage,
  toFirstPage: noticePage.firstPage,
};

// 列表页
let addDetailInfo = () => {};

export async function handleIndexPage() {
  // 接收来自详情页的消息
  window.addEventListener('message', e => {
    if (e.origin !== Origin) return;
    const eData = e.data;
    if (eData.type === MsgType.sendDetailInfo) {
      addDetailInfo(eData);
    }
  });

  regMsgListener(handleMsg);
  Log('list.js 执行 regMsgListener 完成');

  const runing = await ChromeStorage.get(Runing);
  Log('runing: ', runing);
  if (runing) {
   const indexPageRes = await parseIndexPage();
    indexPageRes && (addDetailInfo = indexPageRes.updateDetailCol);
  }
}


async function handleMsg(request, sender, sendResponse) {
  if (sender.id !== ExtendId) return;

  const reqType = request.type;
  if (reqType === MsgType.syncParam) {
    // 来自popup的消息，将列表页面的搜索参数同步到 popup
    const searchParam = {};
    Object.keys(PageCfg).forEach(k => {
      if (typeof PageCfg[k].get === 'function') {
        searchParam[k] = PageCfg[k].get();
      }
    });
    sendResponse(searchParam);

  } else if (reqType === MsgType.startParse) {
    Log('来自popup的消息, 开始解析, ', request.data);
    Storager.set(IsRendedKey, false);
    ChromeStorage.set({ [Runing]: true });
    Storager.set(PopupParamKey, request.data);
    Storager.remove(SearchResultKey);
    parseIndexPage(request.data).then(indexPageRes2 => {
      if (indexPageRes2) {
        addDetailInfo = indexPageRes2.updateDetailCol;
      }
    });
    sendResponse();

  } else if (reqType === MsgType.getFilterResult) {

    // 选项页打开，发送数据给选项页
    const indexPage = Storager.get(SearchResultKey);
    sendResponse(indexPage);
  }
}

async function parseIndexPage(popupForm) {
  const isActiveExtension = await ChromeStorage.get(Runing);
  if (!isActiveExtension) return;

  // 获取页面参数
  const pageInfo = {};
  pageInfo.title = document.title;
  pageInfo.parseTime = getNow();
  Object.keys(PageCfg).forEach(k => {
    if (typeof PageCfg[k].get === 'function') {
      pageInfo[k] = PageCfg[k].get();
    }
  });

  // 定位到第一页
  const isRended = Storager.get(IsRendedKey);
  if (!isRended && pageInfo.curPageNum !== 1) {
    PageCfg.toFirstPage();
    return;
  }
  Storager.set(IsRendedKey, true);

  // 是否需要修改页面参数
  let isTargetSearchVa = true;
  if (popupForm) {
    SearchField.forEach(k => {
      if (popupForm.hasOwnProperty(k) && popupForm[k] !== pageInfo[k]) {
        PageCfg[k].set(popupForm[k]);
        isTargetSearchVa = false;
      }
    });
  } else {
    popupForm = Storager.get(PopupParamKey);
  }
  if (!isTargetSearchVa) {
    // 刷新页面
    PageCfg.submitSearch();
    return;
  }

  // 解析表格
  const tableInfo = PageCfg.getTableVal(); // { header, dataRow: [[col], [col]] }
  const filterCb = row => row[4].includes('住宅');
  tableInfo.dataRow = tableInfo.dataRow.filter(row => filterCb(row));
  const dataRowNum = tableInfo.dataRow.length;
  Log(`数据行: ${dataRowNum}`);

  const detailUrlIdx = {};
  tableInfo.dataRow.forEach((row, rIdx) => {
    const detailHref = row[row.length - 1];
    detailUrlIdx[detailHref] = rIdx;
  });


  // 当前table处理完成, 继续下一页
  let count = 0;
  const completeCb = () => {
    Storager.append('tableRow', tableInfo.dataRow);
    if (pageInfo.curPageNum >= pageInfo.totalPageNum) {
      // 重置 isRun
      ChromeStorage.set({ [Runing]: false });
      const data = { pageInfo, tableInfo };
      tableInfo.dataRow = Storager.get('tableRow');
      Storager.set(SearchResultKey, data);
      Storager.remove('tableRow');
      const href = 'chrome-extension://dmpmcohcnfkhemdccjefninlcelpbpnl/render-page/house-dep/search-result/index.html';
      dialog(`
        <h2>总数据: ${tableInfo.dataRow.length}</h2>
        <p style="color:blue"><a href="${href}" target="_blank">搜索结果</a></p>
      `);
    } else {
      // 下一页
      PageCfg.nextPage();
    }
  };

  // 添加详情信息
  const updateDetailCol = detail => {
    ++count;
    const rIdx = detailUrlIdx[detail.url];
    const curRow = tableInfo.dataRow[rIdx];
    curRow[curRow.length - 1] = detail;
    if (count >= dataRowNum) {
      completeCb();
    }
  };

  // 打开详情页
  if (popupForm[SearchFields.isParseDetail.key]) {
    if (dataRowNum > 0) {
      setTimeout(() => {
        tableInfo.dataRow.forEach(row => {
          const detailUrl = row[row.length - 1];
          const targetW = window.open(detailUrl, '_blank');
        });
      });
    } else {
      completeCb();
    }
  } else {
    completeCb();
  }

  return {
    pageInfo,
    tableInfo,
    updateDetailCol,
  };
}
