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

const sendMeg = (data, callback) => {
  const cb = (tabs) => chrome.tabs.sendMessage(tabs[0].id, data, callback);
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
  const BList = [6, 8, 9, 10];
  const ExCol = ['可售数量', '价格', '面积'];
  let _header = tableInfo.header;
  _header = [..._header.slice(0, -1), ...ExCol, _header[_header.length -1]];
  let theadArr = _header.map((col, cInd0) => `<th>${col}_${cInd0}</th>`);
  theadArr = theadArr.filter((_, colIdx0) => !BList.includes(colIdx0));
  
  let hasDetailTable = false;
  const tbody = dataRow.map((row, rInd) => {
    const lastCol = row[row.length - 1];
    hasDetailTable = typeof lastCol !== 'string';
    let detailUrl = '';
    if (hasDetailTable) {
      detailUrl = lastCol.url;
    } else {
      detailUrl = lastCol;
    }

    let colArr = row.map((col, cIdx) => {
      if (cIdx !== row.length - 1) {
        return `<td class="col-${cIdx}">${col}</td>`;
      }
      return `<td class="col-${cIdx}">
        <div><a href="${detailUrl}" target="_blank">详情</a></div>
        <div class="expand-btn" rInd="${rInd}">${hasDetailTable ? '展开' : ''}</div>
      </td>`;
    });
    colArr = colArr.filter((_, colIndx2) => !BList.includes(colIndx2));
    let proRow = `<tr>${colArr.join('')}`;

    if (!hasDetailTable) {
      return proRow;
    }
    
    const unitList = lastCol.info; // 单元列表
    const detailTbody = unitList.map(unitItem => `<tr>
      <td>${unitItem.building}栋${unitItem.unit}单元</td>
      <td>${unitItem.salesNum}</td>
      <td>${unitItem.price[0]} - ${unitItem.price[1]}</td>
      <td>${unitItem.areaSize[0]} - ${unitItem.areaSize[1]}</td>
    </tr>`);
    const detailTable = `
      <table class="detail-table rind-${rInd}">
        <thead>
          <tr><td>栋/单元</td><td>可售数量</td><td>价格</td><td>面积</td></tr>
        </thead>
        <tbody>${detailTbody.join('')}</tbody>
      </table>
    `;
    const detailRow = `<tr><td colspan="20">${detailTable}</td></tr>`;
    // 添加扩展列
    const totalNum = unitList.reduce((acc, cur) => acc + Number(cur.salesNum), 0);
    Log('totalNum:', totalNum);
    const priceArr = unitList.reduce((acc, item) => [...acc, ...item.price], []);
    const priceRange = `${Math.min(...priceArr)} - ${Math.max(...priceArr)}`;
    const szArr = unitList.reduce((acc, item) => [...acc, ...item.areaSize], []);
    const szRange = `${Math.min(...szArr)} - ${Math.max(...szArr)}`;
    const exCol = [totalNum, priceRange, szRange].map(item => `<td class="nowrap">${item}</td>`);
    colArr = [...colArr.slice(0, -1), ...exCol, colArr[colArr.length - 1]];
    proRow = `<tr>${colArr.join('')}`;
    return [proRow, detailRow].join('');
  });
  if (!hasDetailTable) {
    theadArr.splice(-1 - ExCol.length, ExCol.length);
  }

  const html = `<h2>${pageInfo.title} - ${pageInfo.parseTime}</h2>
    <p>页面信息</p>
    <pre>${JSON.stringify(pageInfo, null, 2)}</pre>
    <p>总数据 ${dataRow.length} 条</p>
    <table>
      <thead>
        <tr>${theadArr.join('')}</tr>
      </thead>
      <tbody>${tbody.join('')}</tbody>
  </table>`;
  const wrap = document.getElementById('content');
  wrap.innerHTML = html;
  // 注册监听器
  setTimeout(() => {
    const expandBtns = Array.from(document.querySelectorAll('.expand-btn'));
    Log('expandBtns', expandBtns);
    expandBtns.forEach(btn => {
      btn.onclick = () => {
        const rInd2 = btn.getAttribute('rInd');
        btn.textContent = btn.textContent === '展开' ? '收起' : '展开';
        const detailWrap = document.querySelector(`.detail-table.rind-${rInd2}`);
        detailWrap.classList.toggle('show');
      };
    });
  }, 1000);
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

