/**
 * 解析table
 * @return Object<header, dataRow>
 */
 export const parseTable = tableSeletor => {
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
};


export function insetScript(src) {
  const tag = document.createElement('script');
  tag.type = 'module';
  tag.src = src;
  document.body.appendChild(tag);
}
// insetScript('chrome-extension://dmpmcohcnfkhemdccjefninlcelpbpnl/renderPage/house-dep/entry.js');
