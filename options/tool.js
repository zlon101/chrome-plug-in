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
  const tbody = dataRow.map(row => `<tr>${row.map((col, cIdx) => {
      if (cIdx !== row.length - 1) {
        return `<td class="col-${cIdx}">${col}</td>`;
      }
      // Log(col);
      const unitList = col.info.map(unitItem => `<div class="unit-item">
        <p>${unitItem.building}栋${unitItem.unit}单元</p>
        <p>可售数量: ${unitItem.salesNum}</p>
        <p>价格: ${unitItem.price[0]} - ${unitItem.price[1]}</p>
        <p>面积: ${unitItem.areaSize[0]} - ${unitItem.areaSize[1]}</p>
      </div>`);
      return `<td class="col-${cIdx}">
        ${unitList.join('')}
        <a href="${col.url}" target="_blank">详情</a>
      </td>`;
    }).join('')}</tr>`).join('');
  
  const html = `<h2>${pageInfo.title} - ${pageInfo.parseTime}</h2>
  <p>页面信息</p>
  <pre>${JSON.stringify(pageInfo, null, 2)}</pre>
  <p>总数据 ${dataRow.length} 条</p>
  <table>
    <thead>
      <tr>${thead}</tr>
    </thead>
    <tbody>${tbody}</tbody>
  </table>`;
  const wrap = document.getElementById('content');
  wrap.innerHTML = html;
};

const Log = (...args) => console.log('\n🔥', ...args);