'use strict';
/**
 * hack 日志输出模块。
 * @namespace hack.log
 */

var util = require('util');

/**
 * [级别] 全部输出
 * @name L_ALL
 * @memberOf hack.log
 */
exports.L_ALL = 0x01111;

/**
 * [级别] 输出 notice 信息
 * @name L_NOTIC
 * @memberOf hack.log
 */
exports.L_NOTIC = 0x00001;

/**
 * [级别] 输出 debug 信息
 * @name L_DEBUG
 * @memberOf hack.log
 */
exports.L_DEBUG = 0x00010;

/**
 * [级别] 输出 warning 信息
 * @name L_WARNI
 * @memberOf hack.log
 */
exports.L_WARNI = 0x00100;

/**
 * [级别] 输出 error 信息
 * @name L_ERROR
 * @memberOf hack.log
 */
exports.L_ERROR = 0x01000;

/**
 * [级别] 输出标准信息，包含: error, warning 和 notice 信息。
 * 等价于：`hack.log.L_ERROR | hack.log.L_WARNI | hack.log.L_NOTIC`
 * @name L_NORMAL
 * @memberOf hack.log
 */
exports.L_NORMAL = 0x01101;

/**
 * [级别] 配置项，默认是 `hack.log.L_NORMAL`。 可以外部配置成其他级别。
 * @example
 * // 让 hack 输出 debug 和 warning 信息。
 * hack.log.level = hack.log.L_DEBUG | hack.log.L_WARNI;
 * @name level
 * @memberOf hack.log
 */
exports.level = exports.L_NORMAL;

/**
 * 配置是否需要抛出异常。默认如果遇到错误，hack log 会直接终止进程，可以通过配置此属性为 true 修改成抛出异常。
 * @name throw
 * @memberOf hack.log
 */
exports.throw = false;

/**
 * 配置是否需要输出命令行警告音。
 * @name alert
 * @memberOf hack.log
 */
exports.alert = false;

/**
 * 获取当前时间
 * @param  {Boolean} withoutMilliseconds 是否不显示豪秒
 * @return {String}                     HH:MM:SS.ms
 * @name now
 * @memberOf hack.log
 * @function
 */
exports.now = function(withoutMilliseconds) {
  var d = new Date(),
    str;
  str = [
    d.getHours(),
    d.getMinutes(),
    d.getSeconds()
  ].join(':').replace(/\b\d\b/g, '0$&');
  if (!withoutMilliseconds) {
    str += '.' + ('00' + d.getMilliseconds()).substr(-3);
  }
  return str;
};

/**
 * 打印输出
 * @param  {strict} type [打印输出类型]
 * @param  {string} msg  [打印输出内容]
 * @param  {string} code [打印输出标识码]
 * @inner
 * @name log
 * @memberOf hack.log
 * @function
 */
function log(type, msg, code) {
  code = code || 0;
  if ((exports.level & code) > 0) {
    var listener = exports.on[type];
    if (listener) {
      listener(msg);
    }
    exports.on.any(type, msg);
  }
}

/**
 * 输出 debug 信息。
 * @example
 * hack.log.debug('I say %s, you say %s', 'YoYO', '切克闹');
 * @param  {String} msg 消息内容
 * @param {Mixed} [args...] 可变变量列表
 * @memberOf hack.log
 * @name debug
 * @function
 */
exports.debug = function(msg) {
  msg = util.format.apply(util, arguments);
  log('debug', exports.now().grey + ' ' + msg, exports.L_DEBUG);
};

/**
 * 输出 notice 信息。
 * @param  {String} msg 消息内容
 * @param {Mixed} [args...] 可变变量列表
 * @memberOf hack.log
 * @name notice
 * @function
 */

/**
 * 输出 info 信息。等价于 hack.log.notice
 * @param  {String} msg 消息内容
 * @param {Mixed} [args...] 可变变量列表
 * @memberOf hack.log
 * @name info
 * @function
 */
exports.notice = exports.info = function(msg) {
  msg = util.format.apply(util, arguments);
  log('notice', msg, exports.L_NOTIC);
};

exports.allan = function(msg){
  msg = util.format.apply(util, arguments);
  log('allan', msg, exports.L_NOTIC);
};
/**
 * 输出 warning 信息。
 * @param  {String} msg 消息内容
 * @param {Mixed} [args...] 可变变量列表
 * @memberOf hack.log
 * @name warn
 * @function
 */

/**
 * 输出 warning 信息。等价于 hack.log.warn.
 * @param  {String} msg 消息内容
 * @param {Mixed} [args...] 可变变量列表
 * @memberOf hack.log
 * @name warning
 * @function
 */
exports.warning = exports.warn = function(msg) {
  msg = util.format.apply(util, arguments);
  log('warning', msg, exports.L_WARNI);
};

/**
 * 输出 error 信息。
 * @param  {String | Event} msg 消息内容
 * @param {Mixed} [args...] 可变变量列表
 * @memberOf hack.log
 * @name error
 * @function
 */
exports.error = function(err) {
  var rawMessage = err;

  if (!(err instanceof Error)) {
    err.message && (rawMessage = err.message);
    err = new Error(err.message || util.format.apply(util, arguments));
  }

  // translateError(err, rawMessage);

  if (exports.alert) {
    err.message += '\u0007';
  }
  if (exports.throw) {
    throw err
  } else {
    log('error', err.message, exports.L_ERROR);
    exports.debug(err.stack);
    process.exit(1);
  }
};

/**
 * 格式化输出。完全等价于 {@link https://nodejs.org/api/util.html#util_util_format_format util.format}。
 * @memberOf hack.log
 * @name format
 * @function
 */
exports.format = function() {
  return util.format.apply(util, arguments);
};

/*
 * 打印实际执行方法集合
 * @type {Object}
 * @memberOf hack.log
 * @name on
 */
exports.on = {
  any: function(type, msg) {},
  debug: function(msg) {
    process.stdout.write('\n ' + '[DEBUG]'.grey + ' ' + msg + '\n');
  },
  notice: function(msg) {
    process.stdout.write('\n ' + '[INFO]'.cyan + ' ' + msg + '\n');
  },
  allan: function(msg) {
    process.stdout.write('\n ' + '[allan]'.cyan + ' ' + msg + '\n');
  },
  warning: function(msg) {
    process.stdout.write('\n ' + '[WARNI]'.yellow + ' ' + msg + '\n');
  },
  error: function(msg) {
    process.stdout.write('\n '+ '[ERROR]'.red +' ' + msg + '\n');
  }
};
