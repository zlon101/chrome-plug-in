import { Log, ChromeStorage } from '../util/index.js';

export const SearchFields = {
  searchText: {
    key: 'searchText',
    label: '搜索',
  },
  area: {
    key: 'area',
    label: '地区',
  },
  startDate: {
    key: 'startDate',
    label: '开始日期',
    place: '2022-10-11',
  },
  endDate: {
    key: 'endDate',
    label: '结束日期',
    place: '2022-10-11',
  },
  proName: {
    key: 'proName',
    label: '项目名称',
  },
  isParseDetail: {
    key: 'isParseDetail',
    label: '解析详情页',
    type: 'checkbox',
  },
};

export const SearchFieldKeys = Object.keys(SearchFields);

export const FilterParamKey = 'popup 页面的筛选参数';

export async function getSearchVla(k) {
  const PopFilterVal = await ChromeStorage.get(FilterParamKey);
  if (k) {
    return PopFilterVal[k];
  }
  return PopFilterVal;
}

export function cacheSearchVal(formVal) {
  ChromeStorage.set({ [FilterParamKey]: formVal });
}