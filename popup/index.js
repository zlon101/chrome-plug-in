const Log = (...args) => console.log('\n🔥', ...args);

Log('init');

sendMsgToPage({ type: 'PopupRended' }, res => {
  // Log('PopupRended响应: ', res);
  const keys = Object.keys(res);
  keys.forEach(k => {
    const el = document.querySelector(`input#${k}`);
    const attr = el.type === 'checkbox' ? 'checked' : 'value';
    el[attr] = res[k];
  });
});

const inputEles = Array.from(document.querySelectorAll('input'));
const btnSubmit = document.querySelector('#submit');
btnSubmit.onclick = () => {
  const form = inputEles.reduce((acc, ele) => {
    const type = ele.id;
    const val = ele.type === 'checkbox' ? ele.checked : ele.value.trim();
    acc[type] = val;
    return acc;
  }, {});
  sendMsgToPage({ type: 'UpdateSearch', data: form });
};

function sendMsgToPage(msg, cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, msg, cb);
  });
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   Log('popup.js', sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
//   if (request.greeting === 'hello') sendResponse({ farewell: 'goodbye' });
// });