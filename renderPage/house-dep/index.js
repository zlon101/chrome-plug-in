function insetScript(src) {
  const tag = document.createElement('script');
  tag.type = 'module';
  tag.src = src;
  document.body.appendChild(tag);
}

insetScript('chrome-extension://dmpmcohcnfkhemdccjefninlcelpbpnl/renderPage/house-dep/entry.js');
