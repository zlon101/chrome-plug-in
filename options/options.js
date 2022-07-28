import { Log, sendToCtxJs, saveFile, Storager, regMsgListener } from '../util/index.js';
import { renderTable } from './tool.js';
import VueCfg from './vue-cfg.js';

const app = new Vue(VueCfg);

regMsgListener((req, sender, sendResponse) => {
  // Log('收到消息\nsender\n', sender, 'request\n', req);
  Storager.set('pageData', req);
  app.updateTable(req);
  // renderTable(req);
});

sendToCtxJs({ type: 'OptionRende' }, res => {
  Log('OptionRende 响应:', res);
  Storager.set('pageData', res);
  app.updateTable(res);
  // renderTable(res);
});

app.updateTable(Storager.get('pageData'));
// renderTable(Storager.get('pageData'));

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  const pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}
