import Vue from './vendor/vue.esm.brower.js';
import jsonData from './total.js';

const BList = [6, 8, 9, 10]; // 不显示的列
const ExCol = ['可售数量', '价格', '面积']; // 增加的列

const stringToNumb = v => v ? parseFloat(v) : 0;

function rangeFilter(srcList, rangeStr, fieldKey) {
  if (!rangeStr) return srcList;
  const [min, max] = rangeStr.split('-').map(stringToNumb);
  return srcList.filter(item => {
    let itemVal = item[fieldKey];
    itemVal = Array.isArray(itemVal) ? itemVal : itemVal.split('-');
    const [itemMin, itemMax] = itemVal.map(stringToNumb);
    let isPass = true;
    if (min && itemMin < min) {
      isPass = false;
    }
    if (max && itemMin > max) {
      isPass = false;
    }
    return isPass;
  });
}

function sortCb(item1, item2, fieldKey, minOrMax) {
  const splitInd = minOrMax==='min' ? 0 : 1;
  const [item1Val, item2Val] = [item1, item2].map(_item => {
    if (typeof item1[fieldKey] === 'string') {
      return parseFloat(_item[fieldKey].split('-')[splitInd]);
    }
    return parseFloat(_item[fieldKey][splitInd]);
  });
  return item1Val - item2Val;
}


const cfg = {
  el: '#vue-app-house-dep',
  data: {
    pageInfo: {},
    hasDetail: false,
    tHeader: [],
    tRows: [],
    searchText: '',
    sortVal: 'minPrice',
    priceRange: '150-200',
    sizeRange: '80-120',
    ...jsonData,
  },
  computed: {
    filterResult() {
      let list = JSON.parse(JSON.stringify(this.tRows));
      const PriceIndex = this.tHeader.findIndex(item => item === '价格');
      const SizeIndex = this.tHeader.findIndex(item => item === '面积');

      // 全局搜索
      const _searchText = this.searchText.trim();
      if (_searchText) {
        list = list.filter(cols => cols.slice(0,-1).join('').includes(_searchText));
      }

      if (this.hasDetail) {
        // 价格、面积范围
        list.forEach(row => {
          const oriList = row[row.length-1].info || [];
          row[row.length-1].info = rangeFilter(oriList, this.priceRange, 'price');
          row[row.length-1].info = rangeFilter(row[row.length-1].info, this.sizeRange, 'areaSize');
          // 更新价格
          const dstPriceRange = row[row.length-1].info.map(item => item.price);
          const _minPrice = Math.min(...dstPriceRange.map(item => item[0]));
          const _maxPrice = Math.max(...dstPriceRange.map(item => item[1]));
          row[8] = `${_minPrice} - ${_maxPrice}`;
          // 更新面积
          const dstSizeRange = row[row.length-1].info.map(item => item.areaSize);
          const _minS = Math.min(...dstSizeRange.map(item => item[0]));
          const _maxS = Math.max(...dstSizeRange.map(item => item[1]));
          row[9] = `${_minS} - ${_maxS}`;
        });
        list = list.filter(cols => cols[cols.length-1].info.length > 0);
        // 排序
        switch (this.sortVal) {
          case 'minPrice':
            list.sort((a, b) => sortCb(a,b,PriceIndex,'min'));
            list.forEach(row => row[row.length-1].info.sort((a, b)=>  sortCb(a,b,'price', 'min')));
            break;
          case 'maxPrice':
            list.sort((a, b) => sortCb(a,b,PriceIndex,'max'));
            list.forEach(row => row[row.length-1].info.sort((a, b)=>  sortCb(a,b,'price', 'max')));
            break;
          case 'minSize':
            list.sort((a, b) => sortCb(a,b,SizeIndex,'min'));
            list.forEach(row => row[row.length-1].info.sort((a, b)=>  sortCb(a,b,'areaSize', 'min')));
            break;
          case 'maxSize':
            list.sort((a, b) => sortCb(a,b,SizeIndex,'max'));
            list.forEach(row => row[row.length-1].info.sort((a, b)=>  sortCb(a,b,'areaSize', 'max')));
            break;
          default:
        }
      }

      return list;
    },
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
    },
    onImport() {
      document.querySelector('#file').click();
    },
    onUploadFile(e) {
      const file = e.target.files[0];
      const reader = new FileReader()
      reader.onload = (evt) => {
        const vueData = JSON.parse(evt.target.result);
        Object.keys(vueData).forEach(k => (this.$data[k] = vueData[k]));
      };
      reader.readAsText(file);
    },
  }
};

new Vue(cfg);
