'use strict';

var hookLoaded = false;
var _ = require('./util.js');

var onCompileStart, onCompileEnd, onProcessEnd;

/**
 * hack 整体编译入口。
 * @param {Object} opt 配置项
 * @param {Array} [opt.srcCache] 需要编译的文件列表，当没有填写时，hack 将通过 {@link hack.project.getSource}() 获取
 * @param {Callback} [opt.beforeEach] 编译开始前执行的回调函数，无论走缓存与否。
 * @param {Callback} [opt.afterEach] 编译完成后执行的回调函数，无论走缓存与否。
 * @param {Callback} [opt.beforeCompile] 编译开始前执行，当采用缓存时不执行。
 * @param {Callback} [opt.afterCompile] 编译完成后执行，当采用缓存时不执行。
 * @param {Callback} [opt.beforeCacheRevert] 在缓存被应用到文件对象前执行。
 * @param {Callback} [opt.afterCacheRevert] 在缓存被应用到文件对象后执行。
 * @param {Callback} callback 当整体编译完成后执行。
 * @function
 * @memberOf hack
 * @name release
 */
var exports = module.exports = function(opt, callback) {
  if (typeof opt === 'function') {
    callback = opt;
    opt = {};
  } else {
    opt = opt || {};
  }

  var src = {};
  if (Array.isArray(opt.srcCache) && opt.srcCache.length) {
    opt.srcCache.forEach(function(path) {
      if (!hack.util.isFile(path)) return;

      var file = hack.file(path);
      if (file.release) {
        src[file.subpath] = file;
      }
    });
  } else {
    src = hack.project.getSource();
  }
  var ret = {
    src: src,
    ids: {},
    pkg: {},
    map: {
      res: {},
      pkg: {}
    }
  };

  // 通过 env 的配置来决定。
  var config = hack.media();
  hack.compile.setup(opt);

  // load hooks
  hookLoaded || (hack.util.pipe('hook', function(processor, settings) {
    processor(hack, settings);
  }), hookLoaded = true);

  hack.emit('release:start', ret);
  var total = opt.total || {};
  var resourceMapFiles = [];

  var collect = function(file, type) {
    type = type || 'res';

    if (file.release && file.useMap) {
      //add resource map
      var id = file.getId();
      ret.ids[id] = file;
      var res = file.map = ret.map[type][id] = {
        uri: file.getUrl(),
        type: file.rExt.replace(/^\./, '')
      };
      for (var key in file.extras) {
        if (file.extras.hasOwnProperty(key)) {
          res.extras = file.extras;
          break;
        }
      }
      if (file.requires && file.requires.length) {
        res.deps = file.requires;
      }
    }
    if (file._isResourceMap) {
      resourceMapFiles.push(file); // the resource map file is special
    }
  };

  Object.keys(total).forEach(function(subpath) {
    var file = total[subpath];
    collect(file);
  });

  onCompileStart && hack.removeListener('compile:start', onCompileStart);
  hack.on('compile:start', (onCompileStart = function(file) {
    total[file.subpath] = file;
    opt.beforeEach && opt.beforeEach(file, ret);
  }));

  onCompileEnd && hack.removeListener('compile:end', onCompileEnd);
  hack.on('compile:end', (onCompileEnd = function(file) {
    opt.afterEach && opt.afterEach(file, ret);
    collect(file);

    // 兼容 hack2 中的用法
    if (file.extras && file.extras.derived) {
      file.derived = file.derived.concat(file.extras.derived);
      delete file.extras.derived;
    }

    if (!file.derived || !file.derived.length) {
      return;
    }

    file.derived.forEach(function(obj) {
      obj.__proto__ = file.__proto__;
      total[obj.subpath] = obj;
      obj.defineLikes();

      opt.beforeEach && opt.beforeEach(obj);
      opt.afterEach && opt.afterEach(obj, ret);
      collect(obj);
    });
  }));

  onProcessEnd && hack.removeListener('process:end', onProcessEnd);
  hack.on('process:end', (onProcessEnd = function(file) {
    if (file.useSameNameRequire) {
      if (file.isJsLike) {
        file.addSameNameRequire('.css');
      } else if (file.isHtmlLike) {
        file.addSameNameRequire('.js');
        file.addSameNameRequire('.css');
      }
    }
  }));

  var pending = [];
  var begining = ret.src;
  ret.src = total;

  Object.keys(begining).forEach(function(key) {
    pending.push(begining[key]);
  });

  var onAddFileToCompile = function(file) {
    pending.push(file);
  };

  hack.on('compile:add', onAddFileToCompile);
  try {
    while (pending.length) {
      var file = pending.shift();
      hack.compile(file, opt);
    }
  } finally {
    hack.removeListener('compile:add', onAddFileToCompile);
  }

  // -----------
  // 单文件已编译完成

  //project root
  var root = hack.project.getProjectPath();

  //get pack config
  var conf = config.get('pack');
  if (typeof conf === 'undefined') {
    //from hack-pack.json
    var file = root + '/hack-pack.json';
    if (hack.util.isFile(file)) {
      hack.config.set('pack', conf = hack.util.readJSON(file));
    }
  }

  if (typeof conf === 'undefined') {
    conf = buildPack(ret);
  }

  // package callback
  var cb = function(packager, settings, key, type) {
    hack.log.debug('[' + key + '] start');
    hack.emit(type, ret, conf, opt);
    packager(ret, conf, settings, opt);
    hack.log.debug('[' + key + '] end');
  };

  var packager = _.applyMatches('::package', hack.media().getSortedMatches());

  ['prepackager', 'packager', 'spriter', 'postpackager'].forEach(function(name) {

    if (packager[name]) {
      // hack.match 中配置的优先，所以，这里直接覆盖就行了。
      hack.media().set('modules.' + name, packager[name]);
    }

    hack.util.pipe(name, cb, opt[name]);
  });

  // Object.keys(ret.pkg).forEach(function(subpath) {
  //   var file = ret.pkg[subpath];
  //   collect(file, 'pkg');
  // });

  // filling the resource map file, resourceMapFile is a reference file object
  resourceMapFiles.forEach(function(file) {
    file.setContent(
      file.getContent()
      .replace(
        /\b__RESOURCE_MAP__\b/g,
        JSON.stringify(ret.map, null, file.optimizer ? null : 4)
      )
    );
  });
  hack.emit('release:end', ret);

  //done
  if (callback) {
    callback(ret);
  }
};

/*
 * 根据用户配置的 hack.match 生成 pack 表。
 */
function buildPack(ret) {
  var src = ret.src;
  var pack = {};

  Object.keys(src).forEach(function(subpath) {
    var file = src[subpath];
    var packTo = file.packTo;

    if (!packTo || file.release === false || file.isPartial) {
      return;
    }

    pack[packTo] = pack[packTo] || [];
    pack[packTo].push(file.subpath);
  });

  return pack;
}
