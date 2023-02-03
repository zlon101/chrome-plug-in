import {injectContentJs} from '../render-page/inject-script.js';

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
  const tld = item.menuItemId;
  switch (tld) {
    case ContextMenus.search.id:
      const selectText = item.selectionText.trim();
      if (selectText) {
        handlePageSearch(selectText, tab);
      }
      break;
  }
  // let url = new URL(`https://google.${tld}/search`)
  // url.searchParams.set('q', item.selectionText)
  // chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});


function handlePageSearch(searchText, tab) {
  console.debug('后台程序执行 handlePageSearch');
  injectContentJs(tab.id, hasInjectPageJs, [searchText, tab])
}

// content-script
function hasInjectPageJs (searchText, _tab) {
  function noticePageSearch(searchText) {
    console.debug('🔥 content 执行 noticePageSearch');
    document.dispatchEvent(new CustomEvent('PerformSearchHjq8', {detail: searchText }));
  }

  if (window._PageSearchScriptHasExit) {
    // 已经注入，通知 page
    noticePageSearch(searchText);
    return;
  }

  document.addEventListener('PageSearchScriptHasExit', () => {
    console.debug('🔥 content中监听到 PageSearchScriptHasExit: ');
    window._PageSearchScriptHasExit = true;
  });

  const injectToPage = (jsPath) => {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL(jsPath);
    s.type = 'module';
    return new Promise((resolve, reject) => {
      s.onload = () => resolve();
      s.onerror = (e) => reject({ msg: '注入脚本失败', e });
      (document.head || document.documentElement).appendChild(s);
    });
  }

  try {
    injectToPage('background/page-search.js').then(() => {
      console.debug('🔥 content 向 page 注入脚本成功');
      noticePageSearch(searchText);
    });
  } catch (e) {
    throw e;
  }
}



/****
chrome.action.onClicked.addListener(tab => {
  console.debug('action.onClicked', tab);
  chrome.action.setPopup({popup: '../popup/popup.html'});

  // chrome.scripting.executeScript({
  //   target: {tabId: tab.id},
  //   files: ['content.js']
  // });
});**/