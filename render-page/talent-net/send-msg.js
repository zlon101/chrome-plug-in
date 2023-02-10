// 执行搜索
import {Log, sendToCtxJs, regMsgListener, Storager, ExtendId} from "../../util/index.js";
import { SearchFields } from '../../popup/filter-cfg.js';

export const TalentListPage = '成都市住房和城乡建设局';

const Prefix = 'TalentNet_';
const NotRedirectKey = Prefix+'notRedirect';

export const invokSearch = (param) => {
  return sendToCtxJs({
    title: TalentListPage,
    data: { type: 'StartParse', text: param[SearchFields.searchText.key] },
  });
};

export const listenExtend = (handler) => {
  regMsgListener((request, sender, sendResponse) => {
    if (sender.id !== ExtendId) return;

    const reqType = request.type;
    if (reqType === 'StartParse') {
      Storager.set(NotRedirectKey, false);
      handler(request.text);
      sendResponse();
    }
    // sendResponse();
  });
  Log(`执行 listenExtend 成功`);
}
