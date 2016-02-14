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

        var push = this.push.bind(this);
        opts = opts || {};
        do_bundle(file, opts)
        .then(function(infos){
            // 0ms Timeout in order to stop Promise to catch errors
            setTimeout(function(){
                push(infos.bundle.vinyl_file);
                cb();
            },0);
        });

    });

};

function do_bundle(file, opts){

    return Promise.resolve(
        {
            jspm: {
                root: null,
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
        return (
            set_jspm_package_path(file.base)
        ).then(function(jspm_root){
            infos.jspm.root = jspm_root;
            return infos;
        });
    })
    .then(function(infos){
        return (
            Promise.promisify(temp.open)('gulp-jspm__build.js')
        )
        .then(function(temp_file){
            infos.bundle.path = temp_file.path;
            return infos;
        });
    })
    .then(function(infos){
        return (
            jspm[opts.selfExecutingBundle?'bundleSFX':'bundle'](

                // input
                (function(){
                    var jspm_input = path.relative(infos.jspm.root, file.path);
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
                })() ,

                // output
                infos.bundle.path ,

                // options
                (function(){
                    var jspm_opts = {};
                    for(var i in opts) jspm_opts[i] = opts[i];
                    jspm_opts.sourceMaps = jspm_opts.sourceMaps || file.sourceMap;
                    delete jspm_opts.plugin;
                    delete jspm_opts.arithmetic;
                    delete jspm_opts.selfExecutingBundle;
                    return jspm_opts;
                })()
            )
            .then(function(){
                return infos;
            })
        );
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
        })
        .then(function(){
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

        return infos;
    });
}

function set_jspm_package_path(directory){
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

            if( env.configBase ) {
                jspm.setPackagePath(env.configBase);

                var packageJSON = require(env.configPath);
                if (packageJSON && packageJSON.jspm && packageJSON.jspm.directories && packageJSON.jspm.directories.baseURL) {
                    resolve(path.join(env.configBase, packageJSON.jspm.directories.baseURL));
                    return;
                }
            }

            resolve(env.configBase);
        });
    })
}
