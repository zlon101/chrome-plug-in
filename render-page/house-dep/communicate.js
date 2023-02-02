// 通信
import {sendToCtxJs} from '../../util/index.js';
import Vue from '../../vendor/vue.esm.brower.js';
import VueCfg from './vue-cfg.js';

export const PageTitle = '住建蓉e办';

export const MsgType = {
  syncParam: '同步列表页面筛选参数',
  getFilterResult: '发送筛选结果到选项页',
  startParse: '开始搜索',
  sendDetailInfo: '发送详情页数据',
};

const Prefix = 'house-dep-';
export const Runing = Prefix+'执行中';

// 获取页面筛选参数
export const getFilterParam = async (tabId) => {
  return await sendToCtxJs({
    title: PageTitle,
    data: { type: MsgType.syncParam },
  });
}

// 执行搜索
export const searchHouse = (searchVal) => {
  sendToCtxJs({
    title: PageTitle,
    data: { type: MsgType.startParse, data: searchVal },
  });
};

// 打开选项页，显示筛选结果
export const initOptionPage = async () => {
  const filterRes = await sendToCtxJs({
    data: { type: MsgType.getFilterResult },
    title: PageTitle,
  });
  const app = new Vue(VueCfg);
  app.updateTable(filterRes);
};


// ========= content-script 和 page 通信 =======================
import injectJs from '../inject-script.js';

export const CustomEventName = 'ContentScriptCustomEvent';
export const NoticePageType = {
  prePage: '上一页',
  nextPage: '下一页',
  goFirstPage: '去首页',
  changedReload: '已编程的方式修改页面参数后点击提交按钮刷新页面',
};

// content-script 环境
export function inJectIntoPage() {
  return injectJs('render-page/house-dep/page-script.js');
}

// content-script 环境
export const noticePage = {
  prePage() {
    const event = new CustomEvent(CustomEventName, {detail: NoticePageType.prePage });
    document.dispatchEvent(event);
  },
  nextPage() {
    const event = new CustomEvent(CustomEventName, {detail: NoticePageType.nextPage });
    document.dispatchEvent(event);
  },
  firstPage() {
    const event = new CustomEvent(CustomEventName, {detail: NoticePageType.goFirstPage });
    document.dispatchEvent(event);
  },
  reload() {
    const event = new CustomEvent(CustomEventName, {detail: NoticePageType.changedReload });
    document.dispatchEvent(event);
  },
};

// page 环境
export function listenContentEvent() {
  document.addEventListener(CustomEventName, e => {
    const eventType = e.detail;
    switch (eventType) {
      case NoticePageType.prePage:document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewLast').click()
        break;
      case NoticePageType.nextPage:
        document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnNewNext').click()
        break;
      case NoticePageType.goFirstPage:
        document.getElementById('ID_ucSCXXShowNew2_UcPager1_txtPage').value = 1;
        document.getElementById('ID_ucSCXXShowNew2_UcPager1_btnPageSubmit').click();
        break;
      case NoticePageType.changedReload:
        document.getElementById('ID_ucSCXXShowNew2_btnSccx').click()
        break;
    }
  });
}
// ===================== end ==================================