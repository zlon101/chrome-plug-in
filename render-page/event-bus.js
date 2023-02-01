export default class EventBus {
  static ContentJs = 'content-script';
  static ExtendJs = 'extend-script';
  constructor() {
    this.subscribeOfContentJs = {};
    this.subscribeOfExtend = {};
  }
  addSubscribe(target, type, handle) {
    if (target === EventBus.ContentJs) {
      this.subscribeOfContentJs[type] = handle;
    } else if (target === EventBus.ExtendJs) {
      this.subscribeOfExtend[type] = handle;
    } else {
      console.error(`target 【${target}】 not find!`);
    }
  }
  delSubscribe(target, type) {
    if (target === EventBus.ContentJs) {
      delete this.subscribeOfContentJs[type]
    } else {
      delete this.subscribeOfExtend[type]
    }
  }
  sendToContentJs(type, ...param) {
    const handler = this.subscribeOfExtend[type];
    if (!handler) {
      throw new Error(`【${type}】 事件未监听`);
    }
    return handler(param);
  }
  sendToExtend(type, ...param) {
    const handler = this.subscribeOfContentJs[type];
    if (!handler) {
      throw new Error(`【${type}】 事件未监听`);
    }
    return handler(param);
  }
}