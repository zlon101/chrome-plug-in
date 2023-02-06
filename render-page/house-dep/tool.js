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


export const dialog = contentHtml => {
  const sty = {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '20px',
    border: '4px solid blue',
    'border-radius': '8px',
    background: '#fff',
  };
  const styStr = Object.keys(sty).reduce((acc, k) => {
    acc += `${k}:${sty[k]};`;
    return acc;
  }, '');

  const wrapHtml= `<div id="dialog_prvrmx" style="${styStr}">
    <span class="close_tbx6"
      style="
        position: absolute;
        right:8px;
        top:8px;
        cursor:pointer;
        z-index:222;
      "
    >X</span>
    ${contentHtml}
  </div>`;
  document.body.insertAdjacentHTML('beforeend', wrapHtml);
  setTimeout(()=>{
    const closeBtn = document.querySelector('.close_tbx6');
    closeBtn.addEventListener('click', () => document.querySelector('#dialog_prvrmx').remove());
  }, 1000);
};
