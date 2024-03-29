'use strict';

var last = Date.now();

/*
 * Object.derive，产生一个Class的工厂方法
 * @param  {Function} constructor 构造函数
 * @param  {Object} proto     对象共有变量
 * @return {Function}      构造方法
 * @example
 *   var class1 = Object.derive(function(){ console.log(this.name) }, {name: 'class1'});
 *   var class2 = Object.derive({
 *     constructor: function() {
 *       console.log(this.name)
 *     }
 *   }, {name: 'class2'})
 */
Function.prototype.derive = (constructor, proto) => {
  if (typeof constructor === 'object') {
    proto = constructor;
    constructor = proto.constructor || function () { };
    delete proto.constructor;
  }
  var parent = this;
  var fn = function () {
    parent.apply(this, arguments);
    constructor.apply(this, arguments);
  };
  var tmp = function () { };
  tmp.prototype = parent.prototype;
  var fp = new tmp(),
    cp = constructor.prototype,
    key;
  for (key in cp) {
    if (cp.hasOwnProperty(key)) {
      fp[key] = cp[key];
    }
  }
  proto = proto || {};
  for (key in proto) {
    if (proto.hasOwnProperty(key)) {
      fp[key] = proto[key];
    }
  }
  fp.constructor = constructor.prototype.constructor;
  fn.prototype = fp;
  return fn;
};

//factory
Function.prototype.factory = function () {
  var clazz = this;

  function F(args) {
    clazz.apply(this, args);
  }
  F.prototype = clazz.prototype;
  return function () {
    return new F(arguments);
  };
};

/**
 * hack 名字空间，hack 中所有工具和方法都是通过此变量暴露给外部使用。
 * @namespace hack
 */
var hack = module.exports = {};

// register global variable
Object.defineProperty(global, 'hack', {
  enumerable: true,
  writable: false,
  value: hack
});

/**
 * 事件监听器, hack 中所有的事件都通过它来监听和触发。
 * @name emitter
 * @type {EventEmitter}
 * @namespace hack.emitter
 * @see {@link https://nodejs.org/api/events.html#events_class_events_eventemitter}
 */
hack.emitter = new (require('events').EventEmitter);
['on', 'once', 'removeListener', 'removeAllListeners', 'emit'].forEach(function (key) {
  hack[key] = function () {
    if (arguments[0].match(/^proccess\:/)) {
      arguments[0] = 'process:' + arguments[0].slice(9)
      hack.log.warning('Did you mean ' + arguments[0] + ' event?')
    }
    var emitter = hack.emitter;
    return emitter[key].apply(emitter, arguments);
  };
});

/**
 * 用来监听 hack 中的事件。每次添加都不会有额外的检测工作，也就是说重复添加有可能被调用多次。
 *
 * 注意：以下示例中 type 为 `project:lookup`, 但是它没有多余的意思，就是一段字符串，跟 namespace 没有一点关系。
 *
 * 代理 hack.emitter.on.
 *
 * @example
 * hack.on('project:lookup', function(uri, file) {
 *   // looking for uri from file.
 *   console.log('Looking for %s from $s', uri, file.subpath);
 * });
 * @see {@link https://nodejs.org/api/events.html}
 * @param {Sring} type 事件类型
 * @param {Function} handler 响应函数
 * @function on
 * @memberOf hack
 */

/**
 * 跟 hack.on 差不多，但是只会触发一次。
 *
 * 代理 hack.emitter.once.
 *
 * @example
 * hack.once('compile:start', function(file) {
 *   console.log('The file %s is gona compile.', file.subpath);
 * });
 * @see hack.on
 * @see {@link https://nodejs.org/api/events.html}
 * @param {Sring} type 事件类型
 * @param {Function} handler 响应函数
 * @function once
 * @memberOf hack
 */

/**
 * 取消监听某事件。注意，如果同一个事件类型和同一响应函数被监听了多次，此函数一次只会移除一次。
 *
 * 代理 hack.emitter.removeListener.
 *
 * @example
 * hack.on('project:lookup', function onLookup(uri, file) {
 *   // looking for uri from file.
 *   console.log('Looking for %s from $s', uri, file.subpath);
 * });
 *
 * hack.removeListener('project:lookup', onLookup);
 * @see {@link https://nodejs.org/api/events.html}
 * @function removeListener
 * @param {String} type 事件类型
 * @param {Function} handler 响应函数
 * @memberOf hack
 */

/**
 * 取消监听所有事件监听，如果指定了事件类型，那么只会取消掉指定的事件类型的所有监听。
 *
 * 代理 hack.emitter.removeAllListeners.
 *
 * @see {@link https://nodejs.org/api/events.html}
 * @function removeAllListeners
 * @param {String} [type] 事件类型
 * @memberOf hack
 */

/**
 * 发送事件，将所有监听此事件名的响应函数挨个执行一次，并把消息体参数 args.. 带过去。
 *
 * 代理 hack.emitter.emit.
 *
 * @example
 * hack.emit('donthing', {
 *   foo: 1
 * });
 * @see {@link https://nodejs.org/api/events.html}
 * @param {Sring} type 事件类型
 * @param {Mixed} args... 消息体数据，任意多个，所有参数都可以在 `handler` 中获取到。
 * @function emit
 * @return {Boolean} 如果有事件响应了，则返回 `true` 否则返回 `false`.
 * @memberOf hack
 */


/**
 * 输出时间消耗，单位为 ms.
 * @example
 * hack.time('Comiple cost');
 * // => compile cost 56ms
 * @param  {String} title 描述内容
 * @return {Undefined}
 * @function time
 * @memberOf hack
 */
hack.time = function (title) {
  console.log(title + ' : ' + (Date.now() - last) + 'ms');
  last = Date.now();
};


hack.log = require('./log.js');

// utils
var _ = hack.util = require('./util.js');

// config
hack.config = require('./config.js');

// resource location
hack.uri = require('./uri.js');

// project
hack.project = require('./project.js');

// file
hack.file = require('./file.js');

// cache
hack.cache = require('./cache.js');

// compile kernel
hack.compile = require('./compile.js');

// release api
hack.release = require('./release.js');

['get', 'set', 'env', 'media', 'match', 'hook', 'unhook'].forEach(function (key) {
  hack[key] = function () {
    var config = hack.config;
    return config[key].apply(config, arguments);
  };
});


/**
 * 仅限于 hack-conf.js 中使用，用来包装 hack 插件配置。
 *
 * 需要在对应的插件扩展点中配置才有效，否则直接执行 hack.plugin 没有任何意义。
 *
 * 单文件扩展点：
 * - lint
 * - parser
 * - preprocess
 * - standard
 * - postprocess
 * - optimizer
 *
 * 打包阶段扩展点：
 * - prepacakger
 * - sprite
 * - packager
 * - postpackager
 *
 * @example
 * hack.match('*.scss', {
 *   parser: hack.plugin('sass', {
 *     include_paths: [
 *       './static/scss/libaray'
 *     ]
 *   })
 * });
 *
 * hack.match('::packager', {
 *   postpackager: hack.plugin('loader', {
 *     allInOne: true
 *   });
 * })
 * @memberOf hack
 * @param {String} pluginName 插件名字。
 *
 * 说明：pluginName 不是对应的 npm 包名，而是对应 npm 包名去掉 hack 前缀，去掉插件扩展点前缀。
 *
 * 如：hack-parser-sass 包，在这里面配置就是:
 *
 * ```js
 * hack.match('*.scss', {
 *   parser: hack.plugin('sass')
 * });
 * ```
 * @param {Object} options 插件配置项，具体请参看插件说明。
 * @param {String} [position] 可选：'prepend' | 'append'。默认为空，当给某类文件配置插件时，都是覆盖式的。而通过设置此插件可以做到，往前追加和往后追加。
 *
 * 如：
 *
 * ```js
 * hack.match('*.xxx', {
 *   parser: hack.plugin('a')
 * });
 *
 * // 保留 plugin a 同时，之后再执行 plugin b
 * hack.match('*.xxx', {
 *   parser: hack.plugin('b', null, 'append')
 * });
 * ```
 */
hack.plugin = function (key, options, position) {
  if (arguments.length === 2 && !_.isPlainObject(options)) {
    position = options;
    options = null;
  }

  options = options || {};
  options.__name = options.__plugin = key;
  options.__pos = position;
  options.__isPlugin = true;
  return options;
};

/**
 * hack 的 npm 包信息。
 * @memberOf hack
 */
hack.info = hack.util.readJSON(__dirname + '/../package.json');

/**
 * hack 版本号
 * @memberOf hack
 */
hack.version = hack.info.version;

hack.require = require('./require.js');

hack.cli = require('./cli.js');
