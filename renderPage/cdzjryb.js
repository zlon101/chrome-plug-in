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

/**
 * 搜索结果列表: https://zw.cdzjryb.com/SCXX/Default.aspx?action=ucSCXXShowNew2
 * wishSearchVal: 期望的搜索参数
*/
const PathName = window.location.pathname;
const Origin = window.location.origin;

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
  getTableVal: () => parseTable('table#ID_ucSCXXShowNew2_gridView'),
  // 修改搜索参数后刷新页面
  submitSearch: () => document.getElementById('ID_ucSCXXShowNew2_btnSccx').click(),
  prePage: () => document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewLast').click(),
  nextPage: () => document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewNext').click(),
};

/**
 * 插件配置
extCfg: {
  area: '双流区',
  startDate: '2022-05-16',
  endDate: '2022-08-16',
  isParseDetail: true,
};
*/
const parseIndexPage = async (extCfg) => {
  const { Log, Storage, getNow, ChromeStorage } = await import('./util.js');
  if (!extCfg) {
    extCfg = await ChromeStorage.get(null);
  }

  // 更新筛选参数
  const pageInfo = {};
  pageInfo.title = document.title;
  pageInfo.parseTime = getNow();
  Object.keys(PageCfg).forEach(k => {
    if (typeof PageCfg[k].get === 'function') {
      pageInfo[k] = PageCfg[k].get();
    }
  });
  const searchParam = {};
  let isTargetSearchVa = true;
  Object.keys(extCfg).forEach(k => {
    if (k === 'isParseDetail') return;
    searchParam[k] = extCfg[k];
    isTargetSearchVa = isTargetSearchVa && (!extCfg[k] || extCfg[k] === pageInfo[k]);
  });
  if (!isTargetSearchVa) {
    Object.keys(searchParam).forEach(k => {
      PageCfg[k].set(searchParam[k]);
    });
    // 刷新页面
    PageCfg.submitSearch();
    return;
  }
  ['area', 'startDate', 'endDate'].forEach(k => extCfg[k] = pageInfo[k]);
  ChromeStorage.set(extCfg);

  Log('pageInfo\n', pageInfo);
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
  
  // 打开详情页
  if (extCfg.isParseDetail) {
    setTimeout(() => {
      tableInfo.dataRow.forEach(row => {
        const detailUrl = row[row.length - 1];
        const targetW = window.open(detailUrl, '_blank');
        // setTimeout(() => targetW.postMessage('列表页发送给详情页', Origin), 2000);
      });
    });
  }
  
  // 添加详情信息
  let count = 0;
  return {
    pageInfo,
    tableInfo,
    updateDetailCol: (detail) => {
      ++count;
      Log('添加详情信息\n', detail);
      const rIdx = detailUrlIdx[detail.url];
      const curRow = tableInfo.dataRow[rIdx];
      curRow[curRow.length - 1] = detail;
      if (count === tableInfo.dataRow.length) {
        const data = { pageInfo, tableInfo };
        Storage.set('pageStorage', data);
        sendMeg(data); // 发送给选项页
      }
    },
  };
  // return { pageInfo, tableInfo };
};

// init
(async () => {
  const { Log, Storage, ChromeStorage } = await import('./util.js');

  let addDetailInfo = () => {};
  // 接收来自详情页的消息
  window.addEventListener('message', e => {
    if (e.origin !== Origin) return;
    const eData = e.data;
    if (eData.type === 'DetailInfo') {
      addDetailInfo(eData);
    }
  });

  // 列表页
  if (PathName === '/SCXX/Default.aspx') {
    const indexPageRes = await parseIndexPage();
    addDetailInfo = indexPageRes.updateDetailCol;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // Log('收到消息\n', request, '\n sender\n', sender);
      const ExtendId = 'dmpmcohcnfkhemdccjefninlcelpbpnl';
      if (sender.id !== ExtendId) return;
      
      const reqType = request.type;
      if (reqType === 'UpdateSearch') {
        // 来自popup的消息, 更新筛选参数
        parseIndexPage(request.data).then(indexPageRes2 => {
          addDetailInfo = indexPageRes2.updateDetailCol;
        })
      } else if (reqType === 'PopupRended') {
        // popup打开，同步筛选参数给popup
        ChromeStorage.get(null).then(extCfg1 => {
          sendResponse(extCfg1);
        })
      } else if (reqType === 'OptionRende') {
        // 选项页打开，发送数据给选项页
        const indexPage = Storage.get('pageStorage');
        sendResponse(indexPage);
      }
      return true;
    });
    return;
  }

  // 项目详情页
  if (PathName === '/roompricezjw/index.html') {
    setTimeout(async () => {
      const info = await parseDetailPage();
      window.opener.postMessage({
        type: 'DetailInfo',
        info,
        url: window.location.href,
      }, Origin);
      Log('项目详情页', info);
      setTimeout(() => window.close());
    }, 200);
  }
})();

// =========== 工具方法 ======================================================

/**
 * 详情列表页
 * https://zw.cdzjryb.com/roompricezjw/index.html?param=xx
 * @return Array<可售数量 均价 面积>栋 单元
*/
async function parseDetailPage() {
  const { Log } = await import('./util.js');
  const navList = Array.from(document.querySelectorAll('.room-price-nav .rp-subnav-item'));
  const getTable = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const resutl = { salesNum: 0, price: [0, 0], areaSize: [0, 0] };
        const table = parseTable('.tbl-room table');
        const rowList = table.dataRow.filter(row => row[5].includes('可售'));
        if (!rowList.length) {
          resolve(resutl);
          return;
        }
        const areaSizes = rowList.map(row  => row[2]);
        const [minSz, maxSz] = [Math.min(...areaSizes), Math.max(...areaSizes)];
        const prices = rowList.map(row  => row[4]);
        let [minPrice, maxPrice] = [Math.min(...prices), Math.max(...prices)];
        minPrice = (minPrice / 10000).toFixed(2);
        maxPrice = (maxPrice / 10000).toFixed(2);
        // table.dataRow = rowList;
        resutl.salesNum = rowList.length;
        resutl.price = [minPrice, maxPrice];
        resutl.areaSize = [minSz, maxSz];
        resolve(resutl);
      }, 1000);
    });
  };

  Log('navList.length: ', navList.length);
  const url = window.location.href;
  const buildings = [];
  for (let i = 0; i < navList.length; i++) {
    const nav = navList[i];
    const building = nav.getAttribute('data-parentval'); // 栋
    const unit = nav.getAttribute('data-val'); // 单元
    nav.click();
    const result = await getTable();
    buildings.push({ ...result, building, unit, url });
  }
  return buildings;
}

/**
 * 解析table
 * @return Object<header, dataRow>
*/
function parseTable(tableSeletor) {
  const handlerRow = (_tr, selector) => {
    const cols = Array.from(_tr.querySelectorAll(selector));
    return cols.map(item => {
      const colTxt = item.textContent.trim();
      if (colTxt !== '详细') return colTxt;
      return item.querySelector('a').href.trim();
    });
  };
  const table = document.querySelector(tableSeletor);
  if (!table) {
    return { header: [], dataRow: [] };
  }
  const trs = Array.from(table.querySelectorAll('tr'));
  const rows = trs.map((row, rIdx) => handlerRow(row, rIdx ? 'td' : 'th'));
  return { header: rows[0], dataRow: rows.slice(1) };
}

/**
 * 发送消息
*/
const sendMeg = (json, cb) => {
  chrome.runtime.sendMessage(json, cb);
};

// chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
//   console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
//   if (request.greeting == 'hello') sendResponse({ farewell: 'goodbye' });
//   else sendResponse({}); // snub them.
// });