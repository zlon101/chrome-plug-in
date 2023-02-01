// 发给消息给content script
export const sendToCtxJs = async ({data, title, url, cb}) => {
  let tab = null;
  if (title || url) {
    [tab] = await chrome.tabs.query({ title, url });
  } else {
    [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  }
  if (!tab) {
    throw new Error(`未找到对应的标签页, url:${url} title: ${title}`);
  }
  const response = await chrome.tabs.sendMessage(tab.id, data);
  console.debug(`
    sendToCtxJs func
    tab: %o
    response: %o
  `, tab, response);
  return response;
};

// onMessage 监听器
export const regMsgListener = handler => {
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handler(request, sender, sendResponse);
      // 异步调用
      return true;
    });
  } catch (e) {
    console.error(`regMsgListener 执行失败`, e);
    throw e;
  }
};

// content-script 发送给 extension
export const sendMsgToExtension = async (json, cb) => {
  // ExtendId
  return  await chrome.runtime.sendMessage(json, cb);
};
