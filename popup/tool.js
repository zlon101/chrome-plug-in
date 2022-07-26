function sendMsgToPage(msg, cb) {
  const queryCb = tabs => chrome.tabs.sendMessage(tabs[0].id, msg, cb);
  // chrome.tabs.query({ active: true, currentWindow: true }, queryCb);
  chrome.tabs.query({
    url: 'https://zw.cdzjryb.com/SCXX/Default.aspx*',
  }, queryCb);
}

const ChromeStorage = {
  get(k) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(k, data => {
        resolve(k ? data[k] : data);
      });
    });
  },
  set(obj) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(obj, data => {
        resolve(data);
      });
    });
  },
  remove(k) {
    chrome.storage.local.remove(k);
  },
};

const Log = (...args) => console.log('\n🔥', ...args);

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   Log('popup.js', sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
//   if (request.greeting === 'hello') sendResponse({ farewell: 'goodbye' });
// });