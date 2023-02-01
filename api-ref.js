/*******

// 扩展程序初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

// background.js
chrome.runtime.onInstalled.addListener(async () => {
  for (let [tld, locale] of Object.entries(tldLocales)) {
    chrome.contextMenus.create({
      id: tld,
      title: locale,
      type: 'normal',
      contexts: ['selection'],
    });
  }
});

// 点击扩展程序
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(extensions)) {
    // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({tabId: tab.id});
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON'

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
  }
})

// 插入css
await chrome.scripting.insertCSS({
  files: ["focus-mode.css"],
  target: { tabId: tab.id },
});

await chrome.scripting.removeCSS({
  files: ["focus-mode.css"],
  target: { tabId: tab.id },
});

// 执行js
// scripting.executeScript()


// 查询某个tab
const tabs = await chrome.tabs.query({
  url: [
    "https://developer.chrome.com/docs/webstore/*",
    "https://developer.chrome.com/docs/extensions/*",
  ],
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.scripting.executeScript(
    tabs[0].id,
    { function: setColor });
});


跨域站点请求
https://developer.chrome.com/docs/extensions/mv3/xhr/


// 消息通知 background.js
function showStayHydratedNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'stay_hydrated.png',
    title: 'Time to Hydrate',
    message: 'Everyday I\'m Guzzlin\'!',
    buttons: [
      { title: 'Keep it Flowing.' }
    ],
    priority: 0
  });
}
**********/