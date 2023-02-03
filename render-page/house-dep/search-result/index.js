import {saveFile} from "../../../util/index.js";
import {renderSearchResult} from "../communicate.js";
import Vue from "../../../vendor/vue.esm.brower.js";

const BList = [6, 8, 9, 10]; // 不显示的列
const ExCol = ['可售数量', '价格', '面积']; // 增加的列

const cfg = {
  el: '#vue-app-house-dep',
  data: {
    pageInfo: {},
    hasDetail: false,
    tHeader: [],
    tRows: [],
  },
  methods: {
    updateTable(pageData) {
      if (!pageData) return;
      const { pageInfo, tableInfo } = pageData;
      this.pageInfo = pageInfo;

      let tRows = tableInfo.dataRow;
      const hasDetail = typeof tRows[0][tRows[0].length - 1] !== 'string';
      this.hasDetail = hasDetail;
      const tHeader = tableInfo.header.filter((_, idx) => !BList.includes(idx));
      hasDetail && tHeader.splice(-1, 0, ...ExCol);
      this.tHeader = tHeader;

      // 删除不显示列, 添加详情列
      tRows.forEach((row, rInd) => {
        const nRow = row.filter((_, cIdx) => !BList.includes(cIdx));
        if (hasDetail) {
          const lastCol = nRow[nRow.length - 1];
          const unitList = lastCol.info;

          const totalNum = unitList.reduce((acc, cur) => acc + Number(cur.salesNum), 0);
          const priceArr = unitList.reduce((acc, item) => [...acc, ...item.price], []);
          const priceRange = `${Math.min(...priceArr)} - ${Math.max(...priceArr)}`;
          const szArr = unitList.reduce((acc, item) => [...acc, ...item.areaSize], []);
          const szRange = `${Math.min(...szArr)} - ${Math.max(...szArr)}`;
          const exCol = [totalNum, priceRange, szRange];
          nRow.splice(-1, 0 , ...exCol);
        }
        tRows[rInd] = nRow;
      });
      this.tRows = tRows;
    },
    onToggle(e) {
      const btn = e.target;
      const rInd2 = btn.getAttribute('rInd');
      btn.textContent = btn.textContent === '展开' ? '收起' : '展开';
      const detailWrap = document.querySelector(`.detail-table.rind-${rInd2}`);
      detailWrap.classList.toggle('show');
    },
    onToggleAll(e) {
      const expandAllBtn = e.target;
      const newExpand = expandAllBtn.textContent !== '展开';
      expandAllBtn.textContent = newExpand ? '展开' : '收起';
      const expandBtns2 = Array.from(document.querySelectorAll('.expand-btn'));
      expandBtns2.forEach(btn => {
        btn.textContent = newExpand ? '展开' : '收起';
      });
      const detailWraps = Array.from(document.querySelectorAll(`.detail-table`));
      detailWraps.forEach(item => !newExpand ? item.classList.add('show') : item.classList.remove('show'));
    },
    savePDF() {
      window.print();
      /***
       // const pageInfo = JSON.parse(document.querySelector('pre').textContent);
      const { pageInfo } = this;
      const pageHtml = document.querySelector('html').outerHTML;
      saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);**/
    },
    saveJSON() {
      saveFile('data-json.js', JSON.stringify(filterRes, null, 2));
    },
    onImport() {
      document.querySelector('#file').click();
    },
    onUploadFile(e) {
      const file = e.target.files[0];
      const reader = new FileReader()
      reader.onload = (evt) => {
        this.updateTable(JSON.parse(evt.target.result));
      };
      reader.readAsText(file);
    },
  }
};

const app = new Vue(cfg);
const filterRes = await renderSearchResult();
app.updateTable(filterRes);


/**
 export function renderTable(data) {
  if (!data) return;

  const { pageInfo, tableInfo } = data;
  const { dataRow } = tableInfo;
  const BList = [6, 8, 9, 10]; // 不显示的列
  const ExCol = ['可售数量', '价格', '面积']; // 增加的列
  let _header = tableInfo.header;
  _header = [..._header.slice(0, -1), ...ExCol, _header[_header.length -1]];
  let theadArr = _header.map((col, cInd0) => {
    if (cInd0 === _header.length - 1) {
      return `<th>
        <p>${col}_${cInd0}</p>
        <div style="display:none" class="expand-all-btn btn">展开</div>
      </th>`;
    }
    return `<th>${col}_${cInd0}</th>`;
  });
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
        <div class="expand-btn btn" rInd="${rInd}">${hasDetailTable ? '展开' : ''}</div>
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
  } else {
    const lastCol2 = theadArr[theadArr.length - 1];
    theadArr[theadArr.length - 1] = lastCol2.replace(/style="display:none"/, '');
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
  document.getElementById('content').innerHTML = html;

  // 注册监听器
  setTimeout(() => {
    const expandBtns = Array.from(document.querySelectorAll('.expand-btn'));
    expandBtns.forEach(btn => {
      btn.onclick = () => {
        const rInd2 = btn.getAttribute('rInd');
        btn.textContent = btn.textContent === '展开' ? '收起' : '展开';
        const detailWrap = document.querySelector(`.detail-table.rind-${rInd2}`);
        detailWrap.classList.toggle('show');
      };
    });

    const expandAllBtn = document.querySelector('.expand-all-btn');
    if (expandAllBtn) {
      expandAllBtn.onclick = () => {
        expandAllBtn.textContent = expandAllBtn.textContent === '展开' ? '收起' : '展开';
        const expandBtns2 = Array.from(document.querySelectorAll('.expand-btn'));
        expandBtns2.forEach(btn => {
          btn.textContent = btn.textContent === '展开' ? '收起' : '展开';
        });
        const detailWraps = Array.from(document.querySelectorAll(`.detail-table`));
        detailWraps.forEach(item => item.classList.toggle('show'));
      };
    }
  }, 1000);
};**/
