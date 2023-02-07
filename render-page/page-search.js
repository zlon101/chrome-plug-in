const log = console.debug;

// ========= 遍历搜索 ===========================
const HighLightElementClass = 'zl_highlight_span';

/**
 * Object<isAllMatch, isCase>
 * **/
const DefaultCfg = {
  isCase: true,
  isAllMatch: false,
  color: 'red',
};

export function traverseDoc(searchText, param = DefaultCfg) {
  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
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
  console.debug('reg', reg);
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
    if (!node.classList.contains(HighLightElementClass) && (ind === N - 1 || !node.contains(result[ind + 1]))) {
      targetEles.push(node);
    }
  });

  // log('$ targetEles', targetEles);

  // 清除上次搜索结果
  for (const highEle of document.querySelectorAll(`.${HighLightElementClass}`)) {
    const parent = highEle.parentElement;
    highEle.outerHTML = highEle.innerText;
    parent.normalize();
  }

  for (const ele of targetEles) {
    findElementAndOffset(ele, reg, param);
  }
  // console.timeEnd();
}

function findElementAndOffset(ele, reg, searchParam) {
  reg.lastIndex = 0;
  let curNode = null,
    fullText = '',
    nodeStack = [];

  const MatchSubTexts = ele.innerText.match(reg),
    matchNum = MatchSubTexts.length,
    RangeStart = new Array(matchNum).fill(null),
    RangeEnd = new Array(matchNum).fill(null);

  const isMatch = _txt => {
    reg.lastIndex = 0;
    return reg.test(_txt);
  };
  const getMatchText = str => {
    reg.lastIndex = 0;
    return reg.exec(str)[0];
  };
  let count = 0;

  log('MatchSubTexts: ', MatchSubTexts);
  const NodeIterator = document.createNodeIterator(ele, NodeFilter.SHOW_TEXT);

  while (curNode = NodeIterator.nextNode()) {
    nodeStack.push(curNode);
    fullText = nodeStack.map(node => node.wholeText).join('');
    if (isMatch(fullText)) {
      RangeEnd[count] = {
        node: curNode,
        matchText: getMatchText((fullText)),
      };
      let startNode;
      do {
        startNode = nodeStack.shift();
        fullText = nodeStack.map(node => node.wholeText).join('');
      } while (isMatch(fullText));

      RangeStart[count] = { node: startNode };
      count++;
      nodeStack = [];
      if (count >= matchNum) {
        nodeStack = null;
        break;
      }
    }
  }
  if (RangeEnd.some(v => !v)) {
    debugger;
  }
  log('Range', RangeStart, RangeEnd);
  if (RangeEnd.length !== RangeStart.length) {
    throw new Error('RangeEnd.length !== RangeStart');
  }


  // 确定偏移
  RangeStart.forEach((startItem, _index) => {
    const endItem = RangeEnd[_index];
    let startInd = 0,
    startText = startItem.node.wholeText,
    endText = endItem.node.wholeText,
    endInd = endText.length - 1,
    _matchText = endItem.matchText;

    // 同一个文本节点
    if (startItem.node && startItem.node === endItem.node) {
      startInd = startText.split(_matchText)[0].length;
      endInd = startInd + _matchText.length - 1;
    } else {
      while (startInd < startText.length && !_matchText.includes(startText.slice(startInd))) {
        ++startInd;
      }
      while (endInd > 0 && !_matchText.includes(endText.slice(0, endInd))) {
        --endInd;
      }
    }
    startItem.offset = startInd;
    endItem.offset = endInd;

    // log(`
    //   startInd: ${rangeStart.offset}
    //   ${startText.slice(startInd)}
    //   endInd: ${rangeEnd.offset}
    //   ${endText.slice(0, endInd)}
    //   ${rangeStart.node === rangeEnd.node}
    // `);
    surroundContents(startItem, endItem, searchParam);
  });
}

function surroundContents(rangeStart, rangeEnd, searchParam) {
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
    span.classList.add(HighLightElementClass);
    span.style.cssText = `background-color:${searchParam.color};`;

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