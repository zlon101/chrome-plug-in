// ==== 在 page-script 环境下运行 ====
import { listenContentEvent } from './communicate.js';

console.debug('测试注入脚本到 page');

listenContentEvent();
