// 执行搜索
import {Storager, sendToCtxJs, regMsgListener, ExtendId} from "../../util/index.js";

export const TalentListPage = '成都市住房和城乡建设局';

export const invokSearch = (param) => {
  return sendToCtxJs({
    title: TalentListPage,
    data: { type: 'StartParse', data: param },
  });
};

export const listenExtend = (handler) => {
  regMsgListener((request, sender, sendResponse) => {
    if (sender.id !== ExtendId) return;

    const reqType = request.type;
    if (reqType === 'StartParse') {
      Storager.set('notRedirect', false);
      const searchText = request.data.searchVal;
      handler(searchText);
    }
    sendResponse();
  });
  console.debug(`执行 listenExtend 结束, `, new Date());
}
