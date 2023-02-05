console.clear();

const log = console.debug;
log('$ normal content-script');

renderSearchDialog();

document.addEventListener('keydown', e => {
  // cmd+shift+f
  if (e.shiftKey && e.metaKey && (e.key === 'f' || e.keyCode === 70)) {
    renderSearchDialog();
  }
});

function renderSearchDialog() {
  const container = document.createElement('div');
  container.id = 'zl_search_warp';
  container.innerHTML = `
    <input type="text" />
  `;
  container.style.cssText = `
    padding: 8px;
    position: fixed;
    z-index: 9999999;
    top: 50px;
    right: 50px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 6px 16px 0 rgba(0,0,0,.08),0 3px 6px -4px rgba(0,0,0,.12),0 9px 28px 8px rgba(0,0,0,.05);
  `;
  container.onkeydown = e => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      onSearch(container.querySelector('input').value);
    }
  };
  document.body.appendChild(container);
  setTimeout(() => container.querySelector('input').focus());
}

async function onSearch(searchText) {
  const { traverseDoc } = await import('../page-search.js');
  traverseDoc(searchText);
}