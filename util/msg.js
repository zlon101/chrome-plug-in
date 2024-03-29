// 发给消息给content script
export const sendToCtxJs = ({data, url, cb}) => {
  const queryCb = tabs => {
    if (!tabs.length) {
      console.log('\n$ sendToCtxJs()未找到tab');
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, data, cb);
  };
  chrome.tabs.query({ url }, queryCb);
};

// onMessage 监听器
export const regMsgListener = handler => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handler(request, sender, sendResponse);
    return true;
  });
};

// 发送消息
export const sendMeg = (json, cb) => {
  chrome.runtime.sendMessage(json, cb);
};


// chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
//   console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
//   if (request.greeting == 'hello') sendResponse({ farewell: 'goodbye' });
//   else sendResponse({}); // snub them.
// });
