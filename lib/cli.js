/**
 * 命令行相关的信息和工具类方法暴露在此模块中。
 * @namespace hack.cli
 */
var cli = module.exports = {};

var path = require('path');
var _ = require('./util.js');
var util = require('util');
var lolcat = require('hack-lolcat');

/**
 * 命令行工具名字
 * @memberOf hack.cli
 * @name name
 * @defaultValue hack
 */
cli.name = 'hack';

/**
 * 指向 {@link https://www.npmjs.com/package/colors colors} 模块。
 * @memberOf hack.cli
 * @name colors
 */
cli.colors = require('colors');

//commander object
cli.commander = null;

/**
 * package.json 中的信息
 * @memberOf hack.cli
 * @name info
 */
cli.info = hack.util.readJSON(path.dirname(__dirname) + '/package.json');

/**
 * 显示帮助信息，主要用来格式化信息，处理缩进等。hack command 插件，可以用此方法来输出帮助信息。
 *
 * @param  {String} [cmdName]  命令名称
 * @param  {Object} [options]  配置
 * @param  {Array} [commands] 支持的命令集合
 * @memberOf hack.cli
 * @name help
 * @function
 */
cli.help = function (cmdName, options, commands) {
  var strs = ['', ' Usage: ' + cli.name + ' ' + (cmdName ? cmdName : '<command>')];

  if (!cmdName) {
    commands = {};
    hack.media().get('modules.commands', []).forEach(function (name) {
      var cmd = hack.require('command', name);
      name = cmd.name || name;
      name = hack.util.pad(name, 12);
      commands[name] = cmd.desc || '';
    });

    options = {
      '-h, --help': 'print this help message',
      '-v, --version': 'print product version and exit',
      '-r, --root <path>': 'specify project root',
      '-f, --file <filename>': 'specify the file path of `hack-conf.js`',
      '--no-color': 'disable colored output',
      '--verbose': 'enable verbose mode'
    };
  }

  options = options || {};
  commands = commands || {};
  var optionsKeys = Object.keys(options);
  var commandsKeys = Object.keys(commands);
  var maxWidth;

  if (commandsKeys.length) {
    maxWidth = commandsKeys.reduce(function (prev, curr) {
      return curr.length > prev ? curr.length : prev;
    }, 0) + 4;

    strs.push(null, ' Commands:', null);

    commandsKeys.forEach(function (key) {
      strs.push(util.format('   %s %s', _.pad(key, maxWidth), commands[key]));
    });
  }

  if (optionsKeys.length) {
    maxWidth = optionsKeys.reduce(function (prev, curr) {
      return curr.length > prev ? curr.length : prev;
    }, 0) + 4;

    strs.push(null, ' Options:', null);

    optionsKeys.forEach(function (key) {
      strs.push(util.format('   %s %s', _.pad(key, maxWidth), options[key]));
    });

    strs.push(null);
  }

  console.log(strs.join('\n'));
};

hack.set('modules.commands', ['init', 'install', 'release', 'server', 'inspect']);

/**
 * 输出 hack 版本信息。
 *
 * ```
 * v3.0.0
 *
 * /\\\\\\\\\\\\\\\  /\\\\\\\\\\\     /\\\\\\\\\\\
 * \/\\\///////////  \/////\\\///    /\\\/////////\\\
 *  \/\\\                 \/\\\      \//\\\      \///
 *   \/\\\\\\\\\\\         \/\\\       \////\\\
 *    \/\\\///////          \/\\\          \////\\\
 *     \/\\\                 \/\\\             \////\\\
 *      \/\\\                 \/\\\      /\\\      \//\\\
 *       \/\\\              /\\\\\\\\\\\ \///\\\\\\\\\\\/
 *        \///              \///////////    \///////////
 * ```
 *
 * @memberOf hack.cli
 * @name version
 * @function
 */
cli.version = function () {
  var content = ['', '  v' + cli.info.version, ''].join('\n');

  var logo;

  if (hack.util.isWin()) {
    logo = [' __' + '/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'.bold.red + '__' + '/\\\\\\\\\\\\\\\\\\\\\\'.bold.yellow + '_____' + '/\\\\\\\\\\\\\\\\\\\\\\'.bold.green + '___', '  _' + '\\/\\\\\\///////////'.bold.red + '__' + '\\/////\\\\\\///'.bold.yellow + '____' + '/\\\\\\/////////\\\\\\'.bold.green + '_' + '       ', '   _' + '\\/\\\\\\'.bold.red + '_________________' + '\\/\\\\\\'.bold.yellow + '______' + '\\//\\\\\\'.bold.green + '______' + '\\///'.bold.green + '__', '    _' + '\\/\\\\\\\\\\\\\\\\\\\\\\'.bold.red + '_________' + '\\/\\\\\\'.bold.yellow + '_______' + '\\////\\\\\\'.bold.green + '_________' + '     ', '     _' + '\\/\\\\\\///////'.bold.red + '__________' + '\\/\\\\\\'.bold.yellow + '__________' + '\\////\\\\\\'.bold.green + '______' + '    ', '      _' + '\\/\\\\\\'.bold.red + '_________________' + '\\/\\\\\\'.bold.yellow + '_____________' + '\\////\\\\\\'.bold.green + '___' + '   ', '       _' + '\\/\\\\\\'.bold.red + '_________________' + '\\/\\\\\\'.bold.yellow + '______' + '/\\\\\\'.bold.green + '______' + '\\//\\\\\\'.bold.green + '__', '        _' + '\\/\\\\\\'.bold.red + '______________' + '/\\\\\\\\\\\\\\\\\\\\\\'.bold.yellow + '_' + '\\///\\\\\\\\\\\\\\\\\\\\\\/'.bold.green + '___', '         _' + '\\///'.bold.red + '______________' + '\\///////////'.bold.yellow + '____' + '\\///////////'.bold.green + '_____', ''].join('\n');
  } else {
    logo = ['   /\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\  /\\\\\\\\\\\\\\\\\\\\\\     /\\\\\\\\\\\\\\\\\\\\\\   ', '   \\/\\\\\\///////////  \\/////\\\\\\///    /\\\\\\/////////\\\\\\        ', '    \\/\\\\\\                 \\/\\\\\\      \\//\\\\\\      \\///  ', '     \\/\\\\\\\\\\\\\\\\\\\\\\         \\/\\\\\\       \\////\\\\\\              ', '      \\/\\\\\\///////          \\/\\\\\\          \\////\\\\\\          ', '       \\/\\\\\\                 \\/\\\\\\             \\////\\\\\\      ', '        \\/\\\\\\                 \\/\\\\\\      /\\\\\\      \\//\\\\\\  ', '         \\/\\\\\\              /\\\\\\\\\\\\\\\\\\\\\\ \\///\\\\\\\\\\\\\\\\\\\\\\/   ', '          \\///              \\///////////    \\///////////     ', ''].join('\n');
  }

  if (hack.get('options.color') !== false) {
    logo = lolcat(logo);
  }
  console.log(content + '\n' + logo);
};

/**
 * hack命令行执行入口。
 * @param  {Array} argv 由 {@link https://github.com/substack/minimist minimist} 解析得到的 argv, 已经转换成了对象。
 * @param  {Array} env  liftoff env
 * @name run
 * @memberOf hack.cli
 * @function
 */
cli.run = function (argv, env) {
  var cmdName = argv._[0];
  if (argv.verbose) {
    hack.log.level = hack.log.L_ALL;
  }

  hack.set('options', argv);
  hack.project.setProjectRoot(env.cwd);

  // 如果指定了 media 值
  if (~['release', 'inspect'].indexOf(cmdName) && argv._[1]) {
    hack.project.currentMedia(argv._[1]);
  }

  env.configPath = env.configPath || argv.f || argv.file;
  hack.log.throw = cmdName !== 'release';

  if (env.configPath) {
    try {
      require(env.configPath);
    } catch (e) {
      if (~['release', 'inspect'].indexOf(cmdName)) {
        hack.log.error('Load %s error: %s \n %s', env.configPath, e.message, e.stack);
      } else {
        hack.log.warn('Load %s error: %s', env.configPath, e.message);
      }
    }

    hack.emit('conf:loaded');
    if (hack.project.currentMedia() !== 'dev' && !~Object.keys(hack.config._groups).indexOf(hack.project.currentMedia())) {
      hack.log.warn('You don\'t have any configurations under the media `%s`, are you sure?', hack.project.currentMedia());
    }
  }

  if (hack.media().get('options.color') === false) {
    cli.colors.mode = 'none';
  }

  var location = env.modulePath ? path.dirname(env.modulePath) : path.join(__dirname, '../');
  hack.log.info('Currently running %s (%s)', cli.name, location);

  if (!argv._.length) {
    cli[argv.v || argv.version ? 'version' : 'help']();
  } else {
    // tip
    // if (cmdName === 'release' && !env.modulePath) {
    //   hack.log.warning('Local `hack` not found, use global version instead.');
    // }

    //register command
    var commander = cli.commander = require('commander');
    var cmd = hack.require('command', cmdName);

    if (cmd.register) {
      // [node, realPath(bin/hack.js)]
      var argvRaw = process.argv;
      //fix args
      var p = argvRaw.indexOf('--no-color');
      ~p && argvRaw.splice(p, 1);

      p = argvRaw.indexOf('--media');
      ~p && argvRaw.splice(p, argvRaw[p + 1][0] === '-' ? 1 : 2);

      // 兼容旧插件。
      cmd.register(commander.command(cmd.name || first).usage(cmd.usage).description(cmd.desc));
      commander.parse(argvRaw);
    } else {
      cmd.run(argv, cli, env);
    }
  }
};