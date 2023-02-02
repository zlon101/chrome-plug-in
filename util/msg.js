import {ChromeStorage} from  './storage.js';

const HasListenerOfContentJs = 'content-script中是否已经调用onMessage.addListener';
const HasListenerOfExtendJs = 'extend中是否已经调用onMessage.addListener';

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

  // chrome.runtime.lastError
  try {
    const response = await chrome.tabs.sendMessage(tab.id, data);
    console.debug(`
      sendToCtxJs 执行成功
      目标页面: ${tab.title}
      response: %o
    `, response);

    chrome.action.setBadgeText({text: ''});
    chrome.action.setBadgeBackgroundColor({color: '#FFF'});
    return response;
  } catch (e) {
    chrome.action.setBadgeText({text: '未监听'});
    chrome.action.setBadgeBackgroundColor({color: 'red'});
    // chrome.action.setBadgeTextColor({color: '#FF0000'});
  }
};

// onMessage 监听器
export const regMsgListener = (handler, context = HasListenerOfContentJs) => {
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handler(request, sender, sendResponse);
      // 异步调用
      return true;
    });
    ChromeStorage.set({ [context]: true });
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

export async function hasListeners(context = HasListenerOfContentJs) {
  return await ChromeStorage.get(context);
}