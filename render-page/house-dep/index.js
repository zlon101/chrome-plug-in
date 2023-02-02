/**
 * 搜索参数
 *   地区
 *   开始时间
 *   结束时间
 * 查询
 *
 * 当前页码
 * 总页数
 * 确定
 * 搜索结果列表: https://zw.cdzjryb.com/SCXX/Default.aspx?action=ucSCXXShowNew2
 */

const PathName = window.location.pathname;
const Origin = window.location.origin;

(async function (){
  const { Log, ChromeStorage } = await import('../../util/index.js');
  const { handleIndexPage } = await import('./list.js');
  const { parseDetailPage } = await import('./detail.js');
  const { Runing, MsgType } = await import('./communicate.js');
  const { getSearchVla, SearchFields } = await import('../../popup/filter-cfg.js');

  // const { default: injectJs } = await import('../inject-script.js');
  // injectJs('render-page/house-dep/page-script.js');


  if (PathName === '/SCXX/Default.aspx') {
    return handleIndexPage();
  }

  // 项目详情页
  const isActiveExtension = await ChromeStorage.get(Runing);
  if (!isActiveExtension) return;

  if (PathName === '/roompricezjw/index.html') {
    const isParseDetail = await getSearchVla(SearchFields.isParseDetail.key);
    if (!isParseDetail) return;

    setTimeout(async () => {
      const info = await parseDetailPage();
      window.opener.postMessage(
        {
          type: MsgType.sendDetailInfo,
          info,
          url: window.location.href,
        },
        Origin,
      );
      Log('项目详情页', info);
      setTimeout(() => window.close());
    }, 200);
  }
})()
