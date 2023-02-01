import { Log } from '../../util/index.js';
const BList = [6, 8, 9, 10]; // 不显示的列
const ExCol = ['可售数量', '价格', '面积']; // 增加的列

const cfg = {
  el: '#vue-app-house-dep',
  data() {
    return {
      pageInfo: {},
      hasDetail: false,
      tHeader: [],
      tRows: [],
    };
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
          Log('lastCol', lastCol);

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
    }
  }
};

export default cfg;
