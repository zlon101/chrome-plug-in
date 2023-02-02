import { Log, saveFile } from '../../util/index.js';
import { initOptionPage } from '../house-dep/communicate.js';
import injectJs from  '../inject-script.js';


const filterResult = await initOptionPage();
// debugger;
injectJs('render-page/house-dep/option-script.js');

document.getElementById('download').onclick = () => {
  const pageInfo = JSON.parse(document.querySelector('pre').textContent);
  const pageHtml = document.querySelector('html').outerHTML;
  saveFile(`${pageInfo.title}${pageInfo.parseTime}.html`, pageHtml);
}
