const Log = (...args) => console.log('\n🔥', ...args);

// const optPage = document.querySelector('.option-page');
// optPage.onclick = () => {
//   window.open('chrome-extension://dmpmcohcnfkhemdccjefninlcelpbpnl/options/options.html', '_blank', 'popup');
// };

const inputEles = Array.from(document.querySelectorAll('input[type="text"]'));
const btnSubmit = document.querySelector('#submit');

btnSubmit.onclick = e => {
  const form = inputEles.reduce((acc, ele) => {
    const type = ele.id;
    acc[type] = ele.value.trim();
    return acc;
  }, {});

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const msg = {
      type: 'GetPageInfo',
      data: form,
    };
    chrome.tabs.sendMessage(tabs[0].id, msg);
  });
};

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   Log('popup.js', sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
//   if (request.greeting === 'hello') sendResponse({ farewell: 'goodbye' });
// });
