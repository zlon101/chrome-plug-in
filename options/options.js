import { Log, saveFile } from '../util/index.js';
import { initOptionPage } from '../render-page/house-dep/communicate.js';

await initOptionPage();

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  const pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}
