export default function (jsPath) {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL(jsPath);
  s.type = 'module';
  return new Promise((resolve, reject) => {
    s.onload = () => resolve();
    s.onerror = (e) => reject({ msg: '注入脚本失败', e });
    (document.head || document.documentElement).appendChild(s);
  });
}

// content-script 通知 extend，extend 注入脚本到 page 中
// 运行在 extend 环境下
export function injectContentJs(tabId, func) {
  chrome.scripting.executeScript({
    target : { tabId },
    func,
  });
}
