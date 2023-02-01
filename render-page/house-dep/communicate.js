// 通信
import {sendToCtxJs} from "../../util/index.js";
import Vue from "../../util/vue.esm.brower.js";
import VueCfg from "./vue-cfg.js";

export const PageTitle = '住建蓉e办';

export const MsgType = {
  syncParam: '同步列表页面筛选参数',
  getFilterResult: '发送筛选结果到选项页',
};

// 获取页面筛选参数
export const getParam = async () => {
  return  await sendToCtxJs({
    title: PageTitle,
    data: { type: MsgType.syncParam },
  });
}

// 执行搜索
export const searchHouse = (searchVal) => {
  sendToCtxJs({
    title: PageTitle,
    data: { type: 'StartParse', data: searchVal },
  });
};

// 打开选项页，显示筛选结果
export const initOptionPage = async () => {
  const filterRes = await sendToCtxJs({
    data: { type: MsgType.getFilterResult },
    title: PageTitle,
  });
  const app = new Vue(VueCfg);
  // Storager.set('pageData', filterRes);
  app.updateTable(filterRes);
};