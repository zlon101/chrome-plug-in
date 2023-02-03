// 注入到 page 环境
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


// 函数在 extend 中调用，func 在 content-script 中执行
export function injectContentJs(tabId, func, args) {
  return chrome.scripting.executeScript({
    target : { tabId },
    func,
    args,
  });
}
