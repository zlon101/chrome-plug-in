import {sendToCtxJs, regMsgListener, ExtendId, log} from "../../util/index.js";

export const MsgType = {
  OpenSearchBoxByPopup: '通知content-js打开搜索框',
  ParseCatalog: '通知content-js解析目录',
  PickElement: '通知content-js开始选择元素',
};

export function addListenerFromPopup(cbMap) {
  regMsgListener((request, sender, sendResponse) => {
    if (sender.id !== ExtendId) return;

    const reqType = request.type;
    const cb = cbMap[reqType];
    if (cb) {
      cb(request);
    } else {
      console.error(`未匹配到相应的 request.type: ${reqType}`);
    }
    // 可能会导致其他监听器被忽略
    // sendResponse();
  });
}

// 通过popup打开搜索框
export function openSearchBox () {
  sendToCtxJs({
    data: { type: MsgType.OpenSearchBoxByPopup },
  })
}

// 通过popup通知content-js开始解析目录
export function onParseCatalog () {
  sendToCtxJs({
    data: { type: MsgType.ParseCatalog },
  })
}

// 通过popup通知content-js开始选择元素
export function startPickElement () {
  sendToCtxJs({
    data: { type: MsgType.PickElement },
  })
}
