import { Log, saveFile, Storager, regMsgListener } from '../util/index.js';
import { initOptionPage } from '../render-page/house-dep/list.js';

Log('rended');

// regMsgListener((req, sender, sendResponse) => {
//   Storager.set('pageData', req);
//   app.updateTable(req);
// });

initOptionPage();

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  const pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}
