const _Storage = {
  set(k, v, type = 'session') {
    const str = typeof v === 'object' ? JSON.stringify(v) : v;
    if (type === 'session') {
      sessionStorage.setItem(k, str);
    } else {
      localStorage.setItem(k, str);
    }
  },
  get(k, type = 'session') {
    if (type === 'session') {
      return JSON.parse(sessionStorage.getItem(k));
    }
    return JSON.parse(localStorage.getItem(k));
  },
};

const sendMeg = json => {
  const cb = (tabs) => {
    // Log('tabs\n', tabs);
    chrome.tabs.sendMessage(tabs[0].id, json);
  };
  chrome.tabs.query({
    url: 'https://zw.cdzjryb.com/SCXX/Default.aspx*',
  }, cb);
};

const saveFile = (fileName, str) => {
  const url = window.URL || window.webkitURL || window;
  const blob = new Blob([str]);
  const saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  saveLink.href = url.createObjectURL(blob);
  saveLink.download = fileName;
  saveLink.click();
};

function renderTable(data) {
  if (!data) return;

  const { pageInfo, tableInfo } = data;
  const { dataRow } = tableInfo;
  const thead = tableInfo.header.map(row => `<th>${row}</th>`).join('');
  
  const tbody = dataRow.map(row => {
    const lastCol = row[row.length - 1];

    const proRow = `<tr>${row.map((col, cIdx) => {
      if (cIdx !== row.length - 1) {
        return `<td class="col-${cIdx}">${col}</td>`;
      }
      return `<td class="col-${cIdx}"><a href="${lastCol.url}" target="_blank">详情</a></td>`;
    }).join('')}</tr>`;

    // Log(col);
    const unitList = lastCol.info;
    const detailTbody = unitList.map(unitItem => `<tr>
      <td>${unitItem.building}栋${unitItem.unit}单元</td>
      <td>${unitItem.salesNum}</td>
      <td>${unitItem.price[0]} - ${unitItem.price[1]}</td>
      <td>${unitItem.areaSize[0]} - ${unitItem.areaSize[1]}</td>
    </tr>`);
    const detailTable = `
      <table class="detail-table">
        <thead>
          <tr><td>栋/单元</td><td>可售数量</td><td>价格</td><td>面积</td></tr>
        </thead>
        <tbody>${detailTbody.join('')}</tbody>
      </table>
    `;
    const detailRow = `<tr><td colspan="20">${detailTable}</td></tr>`;
    return [proRow, detailRow].join('');
  });
  
  const html = `<h2>${pageInfo.title} - ${pageInfo.parseTime}</h2>
    <p>页面信息</p>
    <pre>${JSON.stringify(pageInfo, null, 2)}</pre>
    <p>总数据 ${dataRow.length} 条</p>
    <table>
      <thead>
        <tr>${thead}</tr>
      </thead>
      <tbody>${tbody.join('')}</tbody>
  </table>`;
  const wrap = document.getElementById('content');
  wrap.innerHTML = html;
};

function renderTableV2(data) {
  if (!data) return;

  const { pageInfo, tableInfo } = data;
  const { dataRow } = tableInfo;
  const thead = tableInfo.header;
  
  const tableHtml = dataRow.map(proItem => {
    const headInfo = thead.map((hIte, idx0) => `<p>${hIte}: ${proItem[idx0]}</p>`);
    const N = proItem.length;
    const unitList = proItem[N - 1].info;
    const tbody = unitList.map(unitItem => `<tr>
      <td>${unitItem.building}栋${unitItem.unit}单元</td>
      <td>${unitItem.salesNum}</td>
      <td>${unitItem.price[0]} - ${unitItem.price[1]}</td>
      <td>${unitItem.areaSize[0]} - ${unitItem.areaSize[1]}</td>
    </tr>`);
    return `<section>
      ${headInfo.join('')}
      <table>
        <thead>
          <tr>
            <td>栋/单元</td>
            <td>可售数量</td>
            <td>价格</td>
            <td>面积</td>
          </tr>
        </thead>
        <tbody>${tbody.join('')}</tbody>
      </table>
    </section>`;
  });
  
  const html = `<h2>${pageInfo.title} - ${pageInfo.parseTime}</h2>
    <p>页面信息</p>
    <pre>${JSON.stringify(pageInfo, null, 2)}</pre>
    <p>总数据 ${dataRow.length} 条</p>
    ${tableHtml}
  `;
  const wrap = document.getElementById('content');
  wrap.innerHTML = html;
};

const Log = (...args) => console.log('\n🔥', ...args);