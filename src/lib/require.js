/**
 * 用来加载 hack 插件。通过它来加载插件，会优先从本地安装的 node_modules 目录里面找，然后才是 global
 * 全局安装的 node_modules 里面找。
 *
 * @function require
 * @param {String} paths... 去掉 hack 前缀的包名字，可以以多个参数传进来，多个参数会自动通过 `-` 符号连接起来。
 * @memberOf hack
 * @example
 * // 查找顺序
 * // local: hack-parser-sass
 * // local: hack-parser-sass
 * // global: hack-parser-sass
 * // global: hack-parser-sass
 * hack.require('parser-sass');
 * @property {Array} prefixes 用来配置 hack.require 前缀的查找规则的。默认：['hack', 'hack']。
 * @property {Object} _cache 用来缓存模块加载，避免重复查找。
 */
var slice = [].slice;
var flag = false;
var path = require('path');
var fs = require('fs');
var _ = require('./util.js');
var isFile = _.isFile;
var readFileSync = fs.readFileSync;

var exports = module.exports = function() {
  var name = slice.call(arguments, 0).join('-');
  if (exports._cache.hasOwnProperty(name)) return exports._cache[name];

  // 第一次调用的时候做兼容处理老的一些用法。
  if (!flag) {
    flag = true;
    var global = hack.get('system.globalNPMFolder');

    if (global) {
      hack.log.warn('hack.set(\'system.globalNPMFolder\') is deprecated, please set hack.require.paths instead.');
      exports.paths.push(global);
    }

    var local = hack.get('system.localNPMFolder');

    if (local) {
      hack.log.warn('hack.set(\'system.localNPMFolder\') is deprecated, please set hack.require.paths instead.');

      exports.paths.unshift(local);
    }

    // 去重
    exports.paths = exports.paths.filter(function(item, idx, arr) {

      if (!/node_modules$/.test(item)) {
        hack.log.warn('The path `%s` in hack.require.paths is not end with `node_modules`, and it will be skipped.', item);
        return false;
      }


      return arr.indexOf(item) === idx;
    });

    if (!exports.paths.length) {
      exports.paths = [path.join(path.dirname(__dirname), 'node_modules')];
    }
  }

  var resolved = null;
  var paths = gatherAvailableNodePaths(exports.paths);
  var prefixes = exports.prefixes;
  var names = prefixes.map(function(prefix) {
    return prefix + '-' + name;
  });

  paths.every(function(dir) {
    names.every(function(name) {
      var ret = loadAsFileSync(path.join(dir, '/', name)) || loadAsDirectorySync(path.join(dir, '/', name));

      if (ret) {
        resolved = ret;
      }

      return !resolved;
    });

    return !resolved;
  });

  if (!resolved) {
    hack.log.error('unable to load plugin [%s]', names.join('] or ['));
  }

  hack.log.debug('Resolved module %s to %s', name, resolved);
  return exports._cache[name] = require(resolved);
};

exports.paths = [];
exports._cache = {};
exports.prefixes = ['hack'];
exports.extensions = ['.js'];

function gatherAvailableNodePaths(paths) {
  paths = paths.concat();
  var start = paths.pop();
  var node_modules = paths.concat();

  var prefix = '/';
  if (/^([A-Za-z]:)/.test(start)) {
    prefix = '';
  } else if (/^\\\\/.test(start)) {
    prefix = '\\\\';
  }
  var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\/+/;

  // ensure that `start` is an absolute path at this point,
  // resolving againt the process' current working directory
  start = path.resolve(start);

  var parts = start.split(splitRe);

  var dirs = [];
  for (var i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === 'node_modules') continue;

    dirs = dirs.concat(
      prefix + path.join(
        path.join.apply(path, parts.slice(0, i + 1)),
        'node_modules'
      )
    );
  }

  if (process.platform === 'win32') {
    dirs[dirs.length - 1] = dirs[dirs.length - 1].replace(":", ":\\");
  }

  return node_modules.concat(dirs);
}

function loadAsFileSync(x) {
  if (isFile(x)) {
    return x;
  }

  var extensions = exports.extensions;
  for (var i = 0; i < extensions.length; i++) {
    var file = x + extensions[i];
    if (isFile(file)) {
      return file;
    }
  }
}

function loadAsDirectorySync(x) {
  var pkgfile = path.join(x, '/package.json');
  if (isFile(pkgfile)) {
    var body = readFileSync(pkgfile, 'utf8');
    try {
      var pkg = JSON.parse(body);
      if (pkg.main) {
        var m = loadAsFileSync(path.resolve(x, pkg.main));
        if (m) return m;
        var n = loadAsDirectorySync(path.resolve(x, pkg.main));
        if (n) return n;
      }
    } catch (err) {}
  }

  return loadAsFileSync(path.join(x, '/index'));
}
