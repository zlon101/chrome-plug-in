import { renderTable } from './tool.js';
import { Log, sendToCtxJs, saveFile, Storager, regMsgListener } from '../util/index.js';

regMsgListener((req, sender, sendResponse) => {
  // Log('收到消息\nsender\n', sender, 'request\n', req);
  Storager.set('pageData', req);
  renderTable(req);
});

sendToCtxJs({ type: 'OptionRende' }, res => {
  Log('OptionRende 响应:', res);
  Storager.set('pageData', res);
  renderTable(res);
});

renderTable(Storager.get('pageData'));

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  const pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}
