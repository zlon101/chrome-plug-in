document.addEventListener('PerformSearchHjq8', e => {
  const searchText = e.detail;
  console.log('page 中监听到 Req_HasCusPageScript', e.detail);
  traverseDoc(searchText);
})

document.dispatchEvent(new CustomEvent('PageSearchScriptHasExit'));


// ========= 遍历搜索 ==========================================

const log = console.debug;

function traverseDoc(searchText) {
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
  while (curNode && !currentIsRoot()) {
    const innerText = curNode.innerText;
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
    if (ind === N - 1 || !node.contains(result[ind + 1])) {
      targetEles.push(node);
    }
  });

  // log(`
  // nodeList: %o
  // targetEles: %o
  // `, nodeList, targetEles);

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
    nodeStack = [],
    regRes = null;

  const NodeIterator = document.createNodeIterator(ele, NodeFilter.SHOW_TEXT);

  while (curNode = NodeIterator.nextNode()) {
    nodeStack.push(curNode);
    fullText = nodeStack.map(node => node.wholeText.trim()).join('');
    if (fullText.includes(matchText)) {
      rangeEnd = { node: curNode };
      let startNode;
      do {
        startNode = nodeStack.shift();
        fullText = nodeStack.map(node => node.wholeText.trim()).join('');
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
    span.style.cssText = 'background-color:red;font-size:larger';

    span.appendChild(range.extractContents());
    range.insertNode(span);
  } else {
    console.debug('rangeStart 或 rangeEnd 为null');
  }
}

function isHideElement(element) {
  if (!element.offsetHeight || !element.offsetWidth) {
    return true;
  }
  const styleAttr = window.getComputedStyle(element);
  if (styleAttr.display === 'none'
    || styleAttr.visibility === 'hidden'
    || styleAttr.opacity === '0') {
    return true;
  }
  return false;
}

// ===================================================