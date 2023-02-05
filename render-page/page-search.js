const log = console.debug;

// ========= 遍历搜索 ===========================
const HighLightElementId = 'zl_highlight_span';

export function traverseDoc(searchText) {
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const reg = new RegExp(searchText, 'i');
  if (!reg.test(treeWalker.root.innerText)) {
    return false;
  }

  const currentIsRoot = () => treeWalker.currentNode === treeWalker.root;
  let curNode = treeWalker.nextNode();
  reg.lastIndex = 0;
  let matchEle = null;
  const result = [];
  // console.time();
  // 查找目标element
  while (curNode && !currentIsRoot()) {
    if (isHideElement(curNode) || !reg.test(curNode.innerText)) {
      matchEle && result.push(matchEle);
      matchEle = null;
      curNode = treeWalker.nextSibling();
      while (!curNode && !currentIsRoot()) {
        // 没有下一个兄弟节点, 当前 current node 没有变化
        // treeWalker.previousNode();
        treeWalker.parentNode();
        curNode = treeWalker.nextSibling();
      }
    } else {
      matchEle = curNode;
      matchEle = curNode;
      curNode = treeWalker.nextNode();
    }
    reg.lastIndex = 0;
  }
  matchEle && result.push(matchEle);

  const targetEles = [];
  let N = result.length;
  result.forEach((node, ind) => {
    if (!node.id.includes(HighLightElementId) && (ind === N - 1 || !node.contains(result[ind + 1]))) {
      targetEles.push(node);
    }
  });

  // log('$ targetEles', targetEles);

  for (const ele of targetEles) {
    reg.lastIndex = 0;
    surroundContents(ele, reg.exec(ele.innerText)[0].trim());
  }
  // console.timeEnd();
}

function surroundContents(ele, matchText) {
  let rangeStart = null,
    rangeEnd = null,
    curNode = null,
    fullText = '',
    nodeStack = [];

  const NodeIterator = document.createNodeIterator(ele, NodeFilter.SHOW_TEXT);

  while (curNode = NodeIterator.nextNode()) {
    nodeStack.push(curNode);
    fullText = nodeStack.map(node => node.wholeText).join('');
    if (fullText.includes(matchText)) {
      rangeEnd = { node: curNode };
      let startNode;
      do {
        startNode = nodeStack.shift();
        fullText = nodeStack.map(node => node.wholeText).join('');
      } while (fullText.includes(matchText));
      rangeStart = { node: startNode };
      break;
    }
  }

  let startInd = 0,
    startText = rangeStart.node.wholeText,
    endText = rangeEnd.node.wholeText,
    endInd = endText.length - 1;

  // 空格换行处理？
  if (rangeStart.node && rangeStart.node === rangeEnd.node) {
    startInd = startText.split(matchText)[0].length;
    endInd = startInd + matchText.length - 1;
  } else {
    while (startInd < startText.length && !matchText.includes(startText.slice(startInd))) {
      ++startInd;
    }
    while (endInd > 0 && !matchText.includes(endText.slice(0, endInd))) {
      --endInd;
    }
  }
  rangeStart.offset = startInd;
  rangeEnd.offset = endInd;

  // log(`
  //   startInd: ${rangeStart.offset}
  //   ${startText.slice(startInd)}
  //   endInd: ${rangeEnd.offset}
  //   ${endText.slice(0, endInd)}
  //   ${rangeStart.node === rangeEnd.node}
  // `);

  if (rangeStart && rangeEnd) {
    // 必须是text类型的节点
    if ([rangeStart.node, rangeEnd.node].some(_node => _node.nodeType !== 3)) {
      throw new Error('rangeStart 或 rangeEnd 节点不是 text 类型');
    }
    if (rangeStart.node === rangeEnd.node) {
      rangeEnd.offset++;
    }
    const range = document.createRange();
    range.setStart(rangeStart.node, rangeStart.offset);
    range.setEnd(rangeEnd.node, rangeEnd.offset);

    const span = document.createElement('span');
    span.id = HighLightElementId;
    span.style.cssText = 'background-color:red;'; // font-size:larger

    span.appendChild(range.extractContents());
    range.insertNode(span);
  } else {
    console.debug('rangeStart 或 rangeEnd 为null');
  }
}

function isHideElement(element) {
  if (element.offsetHeight < 2 || element.offsetWidth < 2) {
    return true;
  }
  const styleAttr = window.getComputedStyle(element);
  return styleAttr.display === 'none'
    || styleAttr.visibility === 'hidden'
    || styleAttr.opacity === '0';

}


/**
 * content-script环境下运行
 * 向 page 中注入脚本，然后 content 派发自定义事件，通知 page 执行搜索功能
 * **/
export function contentNoticePageToSearch (searchText) {
  function noticePageSearch(searchText) {
    console.debug('🔥 content 执行 noticePageSearch');
    document.dispatchEvent(new CustomEvent('PerformSearchHjq8', {detail: searchText }));
  }

  if (window._PageSearchScriptHasExit) {
    // 已经注入，通知 page
    noticePageSearch(searchText);
    return;
  }

  document.addEventListener('PageSearchScriptHasExit', () => {
    window._PageSearchScriptHasExit = true;
  });

  const injectToPage = (jsPath) => {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL(jsPath);
    s.type = 'module';
    return new Promise((resolve, reject) => {
      s.onload = () => resolve();
      s.onerror = (e) => reject({ msg: '注入脚本失败', e });
      (document.head || document.documentElement).appendChild(s);
    });
  }

  try {
    injectToPage('background/page-search.js').then(() => {
      // console.debug('🔥 content 向 page 注入脚本成功');
      noticePageSearch(searchText);
    });
  } catch (e) {
    throw e;
  }
}

function listenPerfomSearch() {
  document.addEventListener('PerformSearchHjq8', e => {
    const searchText = e.detail;
    traverseDoc(searchText);
  })

  document.dispatchEvent(new CustomEvent('PageSearchScriptHasExit'));
}