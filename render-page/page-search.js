const log = console.debug;

// ========= 遍历搜索 ===========================
const HighLightElementClass = 'zl_highlight_span';

const getInnerText = (() => {
  const p = document.createElement('p');
  p.style.cssText = 'position:fixed;z-index:-99999;opacity:0;';
  document.body.appendChild(p);
  return str => {
    p.textContent = str;
    return p.innerText;
  };
})();

/**
 * Object<isAllMatch, isCase>
 * **/
const DefaultCfg = {
  isCase: true,
  isAllMatch: false,
  color: 'red',
};

export function traverseDoc(searchText, searchParam = DefaultCfg) {
  // 清除上次搜索结果
  clearLastMark();

  if (!searchText) return;
  const reg = createRegExp(searchText, searchParam);
  if (!reg.test(document.body.innerText)) {
    return false;
  }
  console.debug('reg', reg);

  // 遍历所有 Text 节点  🔥
  const treeWalker = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT); // createTreeWalker
  const getStacksText = nodes => getInnerText(nodes.reduce((acc, cur) => acc + cur.wholeText, ''));
  const isMatch = _txt => {
    reg.lastIndex = 0;
    return reg.test(_txt);
  };

  let curNode = null,
    stackNodes = [],
    stackText = '',
    curNodeText = '';
  const allRanges = [];
  reg.lastIndex = 0;

  while (curNode = treeWalker.nextNode()) {
    curNodeText = curNode.wholeText;
    if (!/\S/.test(curNodeText) || isHideElement(curNode.parentElement)) {
      continue;
    }
    // 拼接字符串
    stackNodes.push(curNode);
    stackText = getStacksText(stackNodes);
    if (isMatch(stackText)) {
      let startNode = null;
      do {
        startNode = stackNodes.shift();
      } while ( isMatch( getStacksText(stackNodes) ) );
      stackNodes.unshift(startNode);
      // 确定Text节点和偏移
      const ranges = findOffset(stackNodes, reg);
      // log('🔥ranges:', ranges);
      allRanges.push(...ranges);
      if (stackNodes.length === 1) {
        stackNodes = [];
      } else {
        stackNodes = [stackNodes.pop()];
      }
    }
  }
  for (const range of allRanges.reverse()) {
    surroundContents(range, searchParam);
  }
}

function findOffset(stackNodes, reg) {
  const N = stackNodes.length;
  if (N === 0) {
    throw new Error('调用findOffset时，参数stackNodes数组长度为0');
  }
  // 匹配的文本在一个Text中
  const startNode =stackNodes[0],
    endNode = stackNodes[N - 1];
  let startText = startNode.wholeText,
    endText = endNode.wholeText,
    startOffset = 0,
    endOffset = endText.length;
  if (N === 1) {
    const ranges = [];
    for (const _matchItem of [...startText.matchAll(reg)]) {
      // debugger;
      startOffset = _matchItem.index;
      endOffset = _matchItem.index + _matchItem[0].length - 1;
      ranges.push({ startNode, endNode, startOffset, endOffset  });
    }
    return ranges;
  }

  // 跨节点
  const midNodeText = stackNodes.slice(1, -1).reduce((acc, cur) => acc + cur.wholeText, '');
  const isMatch = _txt => {
    reg.lastIndex = 0;
    return reg.test(_txt);
  };

  // 二分法搜索优化
  startOffset = dichotomy(startText.length, false, 0, _offset => {
    // log(startText.slice(_offset));
    return isMatch(getInnerText(startText.slice(_offset)  + midNodeText + endText))
  });
  // debugger;

  startText = startText.slice(startOffset);
  // log('startText: ', startText);

  endOffset = dichotomy(endText.length, true, endText.length - 1, _offset => {
    // log(endText.slice(0, _offset));
    return isMatch(getInnerText(startText + midNodeText + endText.slice(0,_offset)))
  });
  // log(endText.slice(endOffset - 3, endOffset));
  return [{ startNode, endNode, startOffset, endOffset  }];
}

function dichotomy(N, forward, offsetInd, matchFn) {
  // debugger;
  if (!matchFn(offsetInd)) {
    return forward ? offsetInd + 1 : offsetInd - 1;
  }
  const midIndex = forward ? Math.floor(offsetInd * 0.5) : Math.floor(offsetInd + 0.5 * (N - offsetInd));
  return dichotomy(N, forward, midIndex, matchFn);
}

function surroundContents(rangeCfg, searchParam) {
  let { startNode, startOffset, endNode, endOffset } = rangeCfg;
  if (startNode && endNode) {
    // 必须是text类型的节点
    if ([startNode, endNode].some(_node => _node.nodeType !== 3)) {
      throw new Error('rangeStart 或 rangeEnd 节点不是 text 类型');
    }
    if (startNode === endNode) {
      endOffset++;
    }
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const span = document.createElement('span');
    span.classList.add(HighLightElementClass);
    span.style.cssText = `background-color:${searchParam.color};`;

    span.appendChild(range.extractContents());
    range.insertNode(span);
  } else {
    console.debug('开始节点或结束节点为null');
  }
}

function createRegExp(searchText, param) {
  if (!searchText) return null;
  let reg = null;
  if (/^\//.test(searchText)) {
    log('正则模式');
    reg = new RegExp(searchText);
  } else {
    if (param.isAllMatch) {
      searchText = `\\b${searchText}\\b`;
    }
    reg = new RegExp(searchText, param.isCase ? 'gm' : 'gmi');
  }
  return reg;
}

function isHideElement(element) {
  if (!element || element.offsetHeight < 2 || element.offsetWidth < 2) {
    return true;
  }
  let hide = false;
  if (typeof element.checkVisibility === 'function') {
    hide = !element.checkVisibility({
      checkOpacity: true,      // Check CSS opacity property too
      checkVisibilityCSS: true // Check CSS visibility property too
    });
  }
  if (hide) {
    return true;
  }
  const styleAttr = window.getComputedStyle(element);
  return styleAttr.display === 'none' || styleAttr.visibility === 'hidden' || styleAttr.opacity === '0';
}

function isHideNode(node) {
  // Element
  if (node.nodeType === 1) {
    return isHideElement(node);
  }
  // Text
  if (node.nodeType === 3) {
    return isHideElement(node.parentElement)
  }
  return false;
}

function clearLastMark() {
  for (const highEle of document.querySelectorAll(`.${HighLightElementClass}`)) {
    const parent = highEle.parentElement;
    highEle.outerHTML = highEle.innerText;
    parent.normalize();
  }
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