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


module.exports = function(opts){

    return through.obj(function(file, enc, cb){

        if( file.isNull() ){
            cb();
            return;
        }

        if( file.isStream() ){
            this.emit('error', new gutil.PluginError(projectName, 'Streams are not supported.'));
            cb();
            return;
        }

        var self = this;
        var push = this.push.bind(this);
        opts = opts || {};
        do_bundle(file, opts)
        .then(function(infos){
            // 0ms Timeout in order to stop Promise to catch errors
            setTimeout(function(){
                push(infos.bundle.vinyl_file);
                cb();
            },0);
        })
        .catch(function(error) {
            setTimeout(function() {
                self.emit('error', new gutil.PluginError(projectName, error));
                cb();
            }, 0);
        });

    });

};

function do_bundle(file, opts){

    info_log.enable = !!opts.verbose;

    return Promise.resolve(
        {
            jspm: {
                baseURL: null,
                package_path: null
            },
            bundle: {
                path: null,
                contents: null,
                sourceMap: null,
                vinyl_file: null
            }
        }
    )
    .then(function(infos){
        info_log('start', infos);

        return (
            get_paths(file.base)
        ).then(function(paths){
            jspm.setPackagePath(paths.package_path);

            infos.jspm.package_path = paths.package_path;
            infos.jspm.baseURL = paths.baseURL;

            info_log('relevant paths retrieved', infos);

            return infos;
        });
    })
    .then(function(infos){
        return (
            Promise.promisify(temp.open)('gulp-jspm__build.js')
        )
        .then(function(temp_file){
            infos.bundle.path = temp_file.path;

            info_log('temporary file created', infos);

            return infos;
        });
    })
    .then(function(infos){
        var jspm_input = (function(){
                var jspm_input = path.relative(infos.jspm.baseURL, file.path);
                if( opts.plugin ) {
                    jspm_input += '!';
                    if( opts.plugin.constructor === String ) {
                        jspm_input += opts.plugin;
                    }
                }
                if( opts.arithmetic ) {
                    jspm_input += ' ' + opts.arithmetic.trim();
                }
                return jspm_input;
        })();

        var jspm_output = infos.bundle.path;

        var jspm_opts = (function(){
                    var jspm_opts = {};
                    for(var i in opts) jspm_opts[i] = opts[i];
                    jspm_opts.sourceMaps = jspm_opts.sourceMaps || file.sourceMap;
                    delete jspm_opts.plugin;
                    delete jspm_opts.arithmetic;
                    delete jspm_opts.selfExecutingBundle;
                    return jspm_opts;
        })();

        var method = opts.selfExecutingBundle?'bundleSFX':'bundle';

        info_log('calling `jspm.'+method+"('"+jspm_input+"','"+jspm_output+"',"+JSON.stringify(jspm_opts)+');`', infos);

        return Promise.resolve(
            jspm[method](jspm_input, jspm_output, jspm_opts)
        )
        .then(function(){
            info_log('jspm.'+method+'() called', infos);

            return infos;
        });
    })
    .then(function(infos){
        return Promise.all(
            [
                fs.readFileAsync(infos.bundle.path)
                .then(function(file_content){
                    if( file.sourceMap ) {
                        var reSourceMapComment = /\n\/\/# sourceMappingURL=.+?$/;
                        infos.bundle.contents = new Buffer(file_content.toString().replace(reSourceMapComment,''));
                    }
                    else {
                        infos.bundle.contents = file_content;
                    }
                })
            ].concat(
                ! file.sourceMap ? [] : (
                    fs.readFileAsync(infos.bundle.path+'.map')
                    .then(function(file_content){
                        infos.bundle.sourceMap = JSON.parse(file_content.toString());
                    })
                )
            )
        )
        .then(function(){
            temp.cleanup();

            info_log('bundle content and potentially sourceMap content read from temporary file(s)', infos);

            return infos;
        });
    })
    .then(function(infos){
        var bundle_file = infos.bundle.vinyl_file =
            new File({
                base: file.base ,
                path: (function(){
                    var basename = path.basename(file.path);
                    basename = basename.split('.');
                    basename.splice(1, 0, 'bundle');
                    basename = basename.join('.');
                    return path.join(path.dirname(file.path), basename);
                })() ,
                contents: infos.bundle.contents
            });

        bundle_file.originalEntryPoint = file;

        if( file.sourceMap ) {
            bundle_file.sourceMap = infos.bundle.sourceMap;
            bundle_file.sourceMap.file = bundle_file.relative;
            bundle_file.sourceMap.sources =
                bundle_file.sourceMap.sources.map(function(relative_to_temp){
                    return (
                        path.relative(
                            file.base,
                            path.resolve(
                                path.dirname(infos.bundle.path),
                                relative_to_temp))
                    );
                });
        }

        info_log('vinyl_file for stream created', infos);

        return infos;
    });
}

function get_paths(directory){
    return new Promise(function(resolve){
        new Liftoff({
            name: 'jspm',
            configName: 'package',
            extensions: {
                '.json': null
            }
        })
        .launch({
            cwd: directory
        }, function(env) {

            resolve({
                baseURL: (function(){
                    if( env.configBase ) {
                        var package_info = require(env.configPath);
                        if(
                          package_info &&
                          package_info.jspm &&
                          package_info.jspm.directories &&
                          package_info.jspm.directories.baseURL ) {
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
    if( info_log.enable ) {
        console.log(
            projectName + ':',
            message + ',',
            'collected information at this point;\n',
            infos
            //JSON.stringify(infos, null, 2)
        );
    }
}
