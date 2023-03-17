import {sendToCtxJs, regMsgListener, ExtendId} from "../../util/index.js";

// 通过popup打开搜索框
export function openSearchBox () {
  sendToCtxJs({
    data: { type: 'OpenSearchBoxByPopup' },
  })
}

export function handleOpenSearchBox(cb) {
  regMsgListener((request, sender, sendResponse) => {
    console.log('handleOpenSearchBox');
    // windows 中 sender.id 不等与 ExtendId
    // if (sender.id !== ExtendId) return;
    const reqType = request.type;
    if (reqType === 'OpenSearchBoxByPopup') {
      cb();
    }
    // 可能会导致其他监听器被忽略
    // sendResponse();
  });
}