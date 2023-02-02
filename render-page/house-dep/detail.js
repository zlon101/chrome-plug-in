/**
 * 详情列表页
 * https://zw.cdzjryb.com/roompricezjw/index.html?param=xx
 * @return Array<可售数量 均价 面积>栋 单元
*/

import { parseTable } from './tool.js';

export async function parseDetailPage() {
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
        const areaSizes = rowList.map(row => row[2]);
        const [minSz, maxSz] = [Math.min(...areaSizes), Math.max(...areaSizes)];
        const prices = rowList.map(row => row[4]);
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


  const url = window.location.href;
  const buildings = [];
  for (let i = 0; i < navList.length; i++) {
    const nav = navList[i];
    const building = nav.getAttribute('data-parentval'); // 栋
    const unit = nav.getAttribute('data-val'); // 单元
    nav.click();
    const result = await getTable();
    result.salesNum && buildings.push({ ...result, building, unit, url });
  }
  return buildings;
}
