export default function (jsPath) {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL(jsPath);
  s.type = 'module';
// s.onload = function() {
//   this.remove();
// };
  (document.head || document.documentElement).appendChild(s);
}