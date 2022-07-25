// import { Log, sendMeg, saveFile, renderTable } from './tool';

sendMeg({ type: 'OptionRende' }, res => {
  Log('OptionRende 响应:', res);
  _Storage.set('pageData', res);
  renderTable(res);
});

// chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
//   Log('收到消息\nsender\n', sender, 'request\n', req);
//   _Storage.set('pageData', req);
//   renderTable(req);
//   return true;
// });

renderTable(_Storage.get('pageData'));

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}
