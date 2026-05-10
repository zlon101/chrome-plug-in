(async() => {
  import('../../vendor/vue.esm.brower.js').then(res => {
    window.Vue = res.default;
  })

  // 控制台选元素工具自动注入
  const injectScript = (await import('../inject-script.js')).default;
  injectScript('render-page/normal/devtools-picker.js');

  // 搜索
  const { MsgType, addListenerFromPopup } = await import('./message.js');
  const { renderSearchDialog } = await import('./search.js');
  const { execParseCatalog } = await import('./parse-catalog.js');
  const { execPickElement } = await import('./pick-element.js');

  addListenerFromPopup({
    [MsgType.OpenSearchBoxByPopup]: renderSearchDialog,
    [MsgType.ParseCatalog]: execParseCatalog,
    [MsgType.PickElement]: execPickElement,
  });

  // 解析目录
  import('./parse-catalog.js');
})();
