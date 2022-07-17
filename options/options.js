const Log = (...args) => console.log('\n🔥', ...args);

Log('options.js');

const saveFile = (fileName, str) => {
  const url = window.URL || window.webkitURL || window;
  const blob = new Blob([str]);
  const saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  saveLink.href = url.createObjectURL(blob);
  saveLink.download = fileName;
  saveLink.click();
};

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  Log('收到消息, sender\n', sender);
  Log('request\n', req);

  const { pageInfo, tableInfo } = req;
  const thead = tableInfo.header.map(row => `<th>${row}</th>`).join('');
  const tbody = tableInfo.dataRow
    .map(row => `<tr>${row.map((col, cIdx) => `<td class="col-${cIdx}">${col}</td>`).join('')}</tr>`)
    .join('');
  
  const html = `<h2>${pageInfo.title} - ${pageInfo.parseTime}</h2>
  <p>页面信息</p>
  <pre>${JSON.stringify(pageInfo, null, 2)}</pre>
  <p>总数据 ${tableInfo.dataRow.length} 条</p>
  <table>
    <thead>
      <tr>${thead}</tr>
    </thead>
    <tbody>${tbody}</tbody>
  </table>`;
  const wrap = document.getElementById('content');
  wrap.innerHTML = html;
  // sendResponse();
});
