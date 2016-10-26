var gutil = require('gulp-util');
var jspm = require('jspm');
var Liftoff = require('liftoff');
var through = require('through2');
var Promise = require('bluebird');
Promise.longStackTraces();
var temp = require('temp').track();
var File = require('vinyl');
var fs = Promise.promisifyAll(require("fs"));
var path = require('path');
var projectName = require('./package.json').name;
var Builder = require('jspm').Builder;
var builder = new Builder();

jspm.on('log', function (type, msg) {
    var logTypes = ['err', 'warn', 'ok', 'info', 'debug'];
    if (logTypes.slice(0, 2).indexOf(type) !== -1) {
        console.error(projectName + ':', msg);
        return;
    }
    info_log(msg);
});

module.exports = function (opts) {

    return through.obj(function (file, enc, cb) {

        if (file.isNull()) {
            cb();
            return;
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(projectName, 'Streams are not supported.'));
            cb();
            return;
        }

        var self = this;
        var push = this.push.bind(this);
        opts = opts || {};
        do_bundle(file, opts)
            .then(function (infos) {
                // 0ms Timeout in order to stop Promise to catch errors
                setTimeout(function () {
                    infos.bundle.vinyl.forEach(push);
                    cb();
                }, 0);
            })
            .catch(function (error) {
                setTimeout(function () {
                    self.emit('error', new gutil.PluginError(projectName, error));
                    cb();
                }, 0);
            });

    });

};


function do_bundle(file, opts) {

    info_log.enable = !!opts.verbose;

    return Promise.resolve(
        {
            jspm: {
                baseURL: null,
                package_path: null
            },
            bundle: {
                dir: null,
                path: null,
                files: {},
                sourceMaps: {},
                vinyl: []
            }
        }
    )
        .then(function (infos) {
            info_log('start', infos);

            return (
                get_paths(file.base)
            ).then(function (paths) {
                jspm.setPackagePath(paths.package_path);

                infos.jspm.package_path = paths.package_path;
                infos.jspm.baseURL = paths.baseURL;

                info_log('relevant paths retrieved', infos);

                return infos;
            });
        })
        .then(function (infos) {
            return Promise.promisify(temp.mkdir)('gulp-jspm_build')
                .then(function (temp_file) {
                    infos.bundle.dir = temp_file;

                    var basename = path.basename(file.path);
                    basename = basename.split('.');
                    basename.splice(1, 0, 'bundle');
                    basename = basename.join('.');

                    infos.bundle.path = path.join(temp_file, basename);

                    info_log('temporary file created', infos);

                    return infos;
                });
        })
        .then(function (infos) {
            var jspm_input = (function () {
                var jspm_input = path.relative(infos.jspm.baseURL, file.path);
                if (opts.plugin) {
                    jspm_input += '!';
                    if (opts.plugin.constructor === String) {
                        jspm_input += opts.plugin;
                    }
                }
                if (opts.arithmetic) {
                    jspm_input += ' ' + opts.arithmetic.trim();
                }

                // SystemJS expects modules written as urls with / instead on \
                // \ is a valid filename on unix so only do this for windows
                if (path.sep === '\\') {
                    jspm_input = jspm_input.replace(/\\/g, '/');
                }

                return jspm_input;
            })();

            var jspm_output = infos.bundle.path;

            var jspm_opts = (function () {
                var jspm_opts = {};
                for (var i in opts) {
                    if (opts.hasOwnProperty(i)) {
                        jspm_opts[i] = opts[i];
                    }
                }
                jspm_opts.sourceMaps = jspm_opts.sourceMaps || file.sourceMap;
                delete jspm_opts.plugin;
                delete jspm_opts.arithmetic;
                delete jspm_opts.selfExecutingBundle;
                delete jspm_opts.verbose;
                return jspm_opts;
            })();

            var method = opts.selfExecutingBundle ? 'buildStatic' : 'bundle';

            info_log('calling `jspm.' + method + "('" + jspm_input + "','" + jspm_output + "'," + JSON.stringify(jspm_opts) + ');`', infos);

            return Promise.resolve(builder[method](jspm_input, jspm_output, jspm_opts))
                .then(function () {
                    info_log('jspm.' + method + '() called', infos);

                    return infos;
                });
        })
        .then(function (infos) {
            return new Promise(function (resolve, reject) {
                fs.readdir(infos.bundle.dir, function (err, filenames) {
                    if (err) {
                        return reject(err);
                    }

                    var promises = [];
                    var reMap = /\.map$/;
                    var reSourceMapComment = /\n\/(\/|\*)# sourceMappingURL=.+?$/;

                    filenames.forEach(function (filename) {
                        promises.push(new Promise(function (resolve, reject) {
                            fs.readFile(path.join(infos.bundle.dir, filename), function (err, file_content) {
                                if (err) {
                                    return reject(err);
                                }

                                if (reMap.test(filename)) {
                                    infos.bundle.sourceMaps[filename.replace(reMap, '')] = JSON.parse(file_content.toString());
                                } else {
                                    infos.bundle.files[filename] = new Buffer(file_content.toString().replace(reSourceMapComment, ''));
                                }

                                return resolve();
                            });
                        }));
                    });

                    Promise.all(promises).then(resolve).catch(reject);
                });
            }).then(function () {
                info_log('bundle content and potentially sourceMap content read from temporary file(s)', infos);

                return infos;
            }).finally(function () {
                temp.cleanup();
            });
        })
        .then(function (infos) {
            Object.keys(infos.bundle.files).map(function (filename) {
                var vinyl = new File({
                    base: file.base,
                    path: path.join(path.dirname(file.path), filename),
                    contents: infos.bundle.files[filename]
                });

                vinyl.originalEntryPoint = file;

                if (infos.bundle.sourceMaps[filename]) {
                    vinyl.sourceMap = infos.bundle.sourceMaps[filename];
                    vinyl.sourceMap.file = vinyl.relative;
                    vinyl.sourceMap.sources = vinyl.sourceMap.sources.map(function (relative_to_temp) {
                        return path.relative(file.base, path.resolve(path.dirname(infos.bundle.path), relative_to_temp));
                    });
                }

                infos.bundle.vinyl.push(vinyl);
            });

            info_log('vinyl_file for stream created', infos);

            return infos;
        });
}

function get_paths(directory) {
    return new Promise(function (resolve) {
        new Liftoff({
            name: 'jspm',
            configName: 'package',
            extensions: {
                '.json': null
            }
        })
            .launch({
                cwd: directory
            }, function (env) {

                resolve({
                    baseURL: (function () {
                        if (env.configBase) {
                            var package_info = require(env.configPath);
                            if (
                                package_info &&
                                package_info.jspm &&
                                package_info.jspm.directories &&
                                package_info.jspm.directories.baseURL) {
                                var baseURL = package_info.jspm.directories.baseURL;
                                return path.join(env.configBase, baseURL);
                            }
                        }
                        return env.configBase;
                    })(),
                    package_path: env.configBase
                });

            });
    });
}

function info_log(message, infos) {
    if (!info_log.enable) {
        return;
    }
    console.log(projectName + ':', message);
    if (infos) {
        console.log('[[ collected information at this point;\n', infos, ']]');
    }
}
