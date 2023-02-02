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

  const fn = async () => {
    const response = await chrome.tabs.sendMessage(tab.id, data);
    console.debug(`
      sendToCtxJs 执行成功
      目标页面: ${tab.title}
      response: %o
    `, response);
    return response;
  }

  // chrome.runtime.lastError
  try {
    return await fn();
  } catch (e) {
    console.error('发送消息给content-script失败: \n', e);
    try {
      await chrome.tabs.reload(tab.id);
      return await fn();
    } catch (e) {
      console.error('重试失败, ', e);
    }
  }
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
