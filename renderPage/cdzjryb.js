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
  tableVal() {
    const handlerRow = (_tr, selector) => {
      const cols = Array.from(_tr.querySelectorAll(selector));
      return cols.map(item => item.textContent.trim());
    };
    const filterCb = row => row[4].includes('住宅');

    const table = document.querySelector('table#ID_ucSCXXShowNew2_gridView');
    const trs = Array.from(table.querySelectorAll('tr'));
    let result = trs.map((row, rIdx) => handlerRow(row, rIdx ? 'td' : 'th'));
    const header = result[0];
    const rows = result.slice(1).filter(row => filterCb(row));
    result = [header, ...rows];
    return result;
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
  const { Log, Storage, saveFile, getNow } = await import('./util.js');
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
  const tableVal = PageCfg.tableVal(); // [[col], [col]]
  Log(`数据行: ${tableVal.length - 1}`);
  const thead = tableVal[0].map(row => `<th>${row}</th>`).join('');
  const tbody = tableVal
    .slice(1)
    .map(row => `<tr>${row.map((col, cIdx) => `<td class="col-${cIdx}">${col}</td>`).join('')}</tr>`)
    .join('');
  const tableHtml = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
      h1 {
        text-align: center;
      }
      table {
        border-spacing: 0;
      }
      th {
        position: sticky;
        top: 0;
      }
      table, th, td {
        border: 1px solid;
      }
      th, td {
        padding: 4px;
        border-top-width: 0;
        border-left-width: 0;
      }
      .col-6, .col-7 {
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <h1>${document.title} - ${getNow()}</h1>
    <pre>PageInfo:\n${JSON.stringify(pageInfo, null, 2)}</pre>
    <p>总数据 ${tableVal.length - 1} 条</p>
    <table>
      <thead>
        <tr>${thead}</tr>
      </thead>
      <tbody>${tbody}</tbody>
    </table>
  </body>
  </html>`;
  // saveFile(`${document.title}-${getNow()}.html`, tableHtml);
})();

// chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
//   console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
//   if (request.greeting == 'hello') sendResponse({ farewell: 'goodbye' });
//   else sendResponse({}); // snub them.
// });
