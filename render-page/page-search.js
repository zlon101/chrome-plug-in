const log = console.debug;

// ========= 遍历搜索 ===========================
export const HighLightElementClass = 'zl_highlight_span';
export const MatchEleCls = 'zl_search_ele';

// const getInnerText = (() => {
//   const p = document.createElement('p');
//   p.style.cssText = 'position:fixed;z-index:-99999;opacity:0;';
//   document.body.appendChild(p);
//   return str => {
//     p.textContent = str;
//     return p.innerText;
//   };
// })();
const getInnerText = str => (str || '').trim();

/**
 * Object<isAllMatch, isCase>
 * **/
const DefaultCfg = {
  isCase: true,
  isAllMatch: false,
  color: 'yellow',
};

export function traverseDoc(searchText, searchParam = DefaultCfg) {
  let startTime = Date.now();
  // 清除上次搜索结果
  clearLastMark();
  if (!searchText) return null;

  const [reg] = createRegExp(searchText, searchParam);
  if (!reg.test(document.body.innerText)) {
    return [];
  }
  // log('reg', reg);
  const isMatch = _txt => {
    reg.lastIndex = 0;
    return reg.test(_txt);
  };

  // 遍历所有 Text 节点  🔥
  let IgnoreDiv = [...document.querySelectorAll('p'), ...document.querySelectorAll('div')].filter(dom => !isMatch(dom.innerText));
  IgnoreDiv = IgnoreDiv.filter(el => window.getComputedStyle(el).display === 'block');
  IgnoreDiv.push(...document.querySelectorAll('#zl_search_warp'));
  log('IgnoreDiv数量', IgnoreDiv.length);
  const inIgnoreDiv = _node => IgnoreDiv.some(_parent => _parent.contains(_node));

  const treeWalker = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT); // createTreeWalker
  const getStacksText = nodes => getInnerText(nodes.reduce((acc, cur) => acc + cur.wholeText, ''));

  let curNode = null,
    stackNodes = [],
    stackText = '',
    curNodeText = '';
  const allRanges = [];
  reg.lastIndex = 0;

  while (curNode = treeWalker.nextNode()) {
    curNodeText = curNode.wholeText;
    if (!/\S/.test(curNodeText) || inIgnoreDiv(curNode) || isHideElement(curNode.parentElement)) {
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

  const matchHtmls = new Array(allRanges.length);
  let count = 0;
  console.debug('traverseDoc 1耗时:', (Date.now() - startTime) / 1000);
  for (const range of allRanges.reverse()) {
    matchHtmls[count++] = surroundContents(range, searchParam);
  }
  console.debug('traverseDoc 2耗时:', (Date.now() - startTime) / 1000);
  return matchHtmls.filter(Boolean).reverse();
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
    return isMatch(getInnerText(startText.slice(_offset)  + midNodeText + endText))
  });
  // debugger;

  startText = startText.slice(startOffset);
  endOffset = dichotomy(endText.length, true, endText.length - 1, _offset => {
    return isMatch(getInnerText(startText + midNodeText + endText.slice(0, _offset+1)))
  });
  // debugger;
  return [{ startNode, endNode, startOffset, endOffset  }];
}

function dichotomy(N, toLeft, offsetInd, matchFn) {
  if (N < 2) {
    return offsetInd;
  }
  let nextInd = toLeft ? offsetInd - 1 : offsetInd + 1;
  nextInd = Math.max( Math.min(nextInd, N - 1), 0);
  let lastInd = toLeft ? offsetInd + 1 : offsetInd - 1;
  lastInd = Math.max( Math.min(lastInd, N - 1), 0);

  const isNextMatch = matchFn(nextInd);
  // 指针位于起始位置
  if (offsetInd === lastInd && !isNextMatch) {
    // debugger;
    return offsetInd;
  }
  // 指针到达终点
  if (offsetInd === nextInd) {
    // debugger;
    return offsetInd;
  }

  const isCurrentMatch = matchFn(offsetInd);
  if (isCurrentMatch && !isNextMatch) {
    // debugger;
    return offsetInd;
  }

  let midIndex = 0;
  if (isCurrentMatch) {
    midIndex = toLeft ? Math.floor(offsetInd * 0.5) : Math.floor(offsetInd + 0.5 * (N - offsetInd));
  } else {
    midIndex = !toLeft ? Math.floor(offsetInd * 0.5) : Math.floor(offsetInd + 0.5 * (N - offsetInd));
  }
  return dichotomy(N, toLeft, midIndex, matchFn);
}

let uid = 1;
function surroundContents(rangeCfg, searchParam) {
  let { startNode, startOffset, endNode, endOffset } = rangeCfg;
  if (startNode && endNode) {
    // 必须是text类型的节点
    if ([startNode, endNode].some(_node => _node.nodeType !== 3)) {
      throw new Error('rangeStart 或 rangeEnd 节点不是 text 类型');
    }
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset + 1);

    const span = document.createElement('span');
    span.classList.add(HighLightElementClass);
    span.style.cssText = searchParam.style || `background-color:${searchParam.color};`;

    span.appendChild(range.extractContents());
    range.insertNode(span);
    const parentEle = range.commonAncestorContainer;

    const splits = parentEle.innerHTML.split(/<span\s+class="zl_highlight_span".*<\/span>/).map(item => item.trim());
    const firstLength = splits[0].length;
    let innerHtml = splits[0].slice(Math.max(0, firstLength-30)) + span.outerHTML + splits[1].slice(0, 30);
    const cls = `${MatchEleCls}_${uid++}`;
    parentEle.classList.add(cls);
    return { innerHtml, cls };
  }
  console.debug('开始节点或结束节点为null');
  return null;
}

function createRegExp(searchText, param) {
  if (!searchText) return null;
  let isRegMode = false
  let reg = null;
  if (/^\//.test(searchText)) {
    log('正则模式');
    isRegMode = true;
    const regModifier = /\/(\w*)$/;
    let modifier = regModifier.exec(searchText)[1];
    !modifier.includes('g') && (modifier += 'g');
    regModifier.lastIndex = 0;
    reg = new RegExp(searchText.slice(1).replace(regModifier, ''), modifier);
  } else {
    searchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (param.isAllMatch) {
      searchText = `\\b${searchText}\\b`;
    }
    reg = new RegExp(searchText, param.isCase ? 'gm' : 'gmi');
  }
  return [reg, isRegMode];
}

function isHideElement(element) {
  if (!element || element.offsetHeight < 2 || element.offsetWidth < 2) {
    return true;
  }
  let hide = false;
  if (typeof element.checkVisibility === 'function') {
    return !element.checkVisibility({
      checkOpacity: true,      // Check CSS opacity property too
      checkVisibilityCSS: true // Check CSS visibility property too
    });
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
  const startTime = Date.now();
  for (const highEle of document.querySelectorAll(`.${HighLightElementClass}`)) {
    const parent = highEle.parentElement;
    highEle.outerHTML = highEle.innerText;
    parent.normalize();
  }
  console.debug('clearLastMark 耗时:', (Date.now()-startTime)/1000);
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