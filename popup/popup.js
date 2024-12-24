import { onParseCatalog, openSearchBox } from '../render-page/normal/message.js';

// 解析目录
document.querySelector('.parse_catalog').onclick = onParseCatalog;
document.querySelector('.popup_search').onclick = openSearchBox;
