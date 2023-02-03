// import {injectContentJs} from '../render-page/inject-script.js';

const ContextMenus = {
  // delDom: {
  //   id: 'del_element',
  //   title: '删除',
  //   type: 'all',
  // },
  search: {
    id: 'searchHighLight',
    title: '搜索',
    type: ['selection']
  }
}

// https://developer.chrome.com/docs/extensions/reference/contextMenus/#method-create
chrome.runtime.onInstalled.addListener(async () => {
  console.debug('chrome.runtime.onInstalled');
  for (let [_, item] of Object.entries(ContextMenus)) {
    chrome.contextMenus.create({
      id: item.id,
      title: item.title,
      contexts: item.type,
      documentUrlPatterns: ['http://*/*', 'https://*/*', 'file://*/*']
    });
  }
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
  console.debug(item);
  const tld = item.menuItemId;
  switch (tld) {
    case ContextMenus.search.id:
      const selectText = item.selectionText.trim();
      if (selectText) {

      }
      break;
  }
  // let url = new URL(`https://google.${tld}/search`)
  // url.searchParams.set('q', item.selectionText)
  // chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});


/****


chrome.action.onClicked.addListener(tab => {
  console.debug('action.onClicked', tab);
  chrome.action.setPopup({popup: '../popup/popup.html'});

  // chrome.scripting.executeScript({
  //   target: {tabId: tab.id},
  //   files: ['content.js']
  // });
});**/