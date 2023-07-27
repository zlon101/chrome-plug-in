(async() => {
  import('../../vendor/vue.esm.brower.js').then(res => {
    window.Vue = res.default;
  })

  // 搜索
  const { MsgType, addListenerFromPopup } = await import('./message.js');
  const { renderSearchDialog } = await import('./search.js');
  const { execParseCatalog } = await import('./parse-catalog.js');
  addListenerFromPopup({
    [MsgType.OpenSearchBoxByPopup]: renderSearchDialog,
    [MsgType.ParseCatalog]: execParseCatalog,
  });

  // 解析目录
  import('./parse-catalog.js');
})();