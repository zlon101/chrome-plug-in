import { onParseCatalog, openSearchBox, startPickElement } from '../render-page/normal/message.js';

// 解析目录
document.querySelector('.parse_catalog').onclick = onParseCatalog;
document.querySelector('.popup_search').onclick = openSearchBox;
document.querySelector('.pick_selector').onclick = startPickElement;

// 控制台选元素提示
const hint = document.getElementById('devtools_hint');
hint.addEventListener('click', () => {
  navigator.clipboard.writeText('copy(__getSelector($0))');
});
hint.title = '点击复制';

// 点击"选元素"时显示提示
document.querySelector('.pick_selector').addEventListener('click', () => {
  hint.classList.toggle('show');
});
