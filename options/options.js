// import { Log, sendMeg, saveFile, renderTable } from './tool';

sendMeg({ type: 'OptionRende' });

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  Log('收到消息\nsender\n', sender, 'request\n', req);
  _Storage.set('pageData', req);
  renderTable(req);
  // sendResponse();
});

renderTable(_Storage.get('pageData'));

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}
