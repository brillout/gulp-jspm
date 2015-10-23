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
    opts = opts || {};

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

        var enable_source_map = !!file.sourceMap;

        var push = this.push.bind(this);

        Promise.resolve()
        .then(function(){
            return set_jspm_package_path(file.base);
        })
        .then(function(){
            return Promise.promisify(temp.open)('gulp-jspm__build.js');
        })
        .then(function(tmp_file){
            return (
                jspm[opts.selfExecutingBundle?'bundleSFX':'bundle'](
                    (function(){
                        var jspm_input = file.relative;
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
                    tmp_file.path ,
                    (function(){
                        var jspm_opts = {};
                        for(var i in opts) jspm_opts[i] = opts[i];
                        jspm_opts.sourceMaps = jspm_opts.sourceMaps || enable_source_map;
                        delete jspm_opts.plugin;
                        delete jspm_opts.arithmetic;
                        delete jspm_opts.selfExecutingBundle;
                        return jspm_opts;
                    })()
                )
                .then(function(){
                    return tmp_file.path;
                })
            );
        })
        .then(function(temp_path){
            var results = {
                temp_path: temp_path
            };
            return Promise.all(
                [
                    fs.readFileAsync(temp_path)
                    .then(function(file_content){
                        if( enable_source_map ) {
                            var reSourceMapComment = /\n\/\/# sourceMappingURL=.+?$/;
                            results.contents = new Buffer(file_content.toString().replace(reSourceMapComment,''));
                        }
                        else {
                            results.contents = file_content;
                        }
                    })
                ].concat(
                    ! enable_source_map ? [] : (
                        fs.readFileAsync(temp_path+'.map')
                        .then(function(file_content){
                            results.sourceMap = JSON.parse(file_content.toString());
                        })
                    )
                )
            )
            .then(function(){
                return results;
            });
        })
        .then(function(results){
            temp.cleanup();
            return results;
        })
        .then(function(results){
            var bundle_file =
                new File({
                    base: file.base ,
                    path: (function(){
                        var basename = path.basename(file.path);
                        basename = basename.split('.');
                        basename.splice(1, 0, 'bundle');
                        basename = basename.join('.');
                        return path.join(path.dirname(file.path), basename);
                    })() ,
                    contents: results.contents
                });

            bundle_file.originalEntryPoint = file;

            if( enable_source_map ) {
                bundle_file.sourceMap = results.sourceMap;
                bundle_file.sourceMap.file = bundle_file.relative;
                bundle_file.sourceMap.sources =
                    bundle_file.sourceMap.sources.map(function(relative_to_temp){
                        return (
                            path.relative(
                                file.base,
                                path.resolve(
                                    path.dirname(results.temp_path),
                                    relative_to_temp))
                        );
                    });
            }

            return bundle_file;
        })
        .then(function(bundle_file){
            // timeout to stop Promise to catch errors
            setTimeout(function(){
                push(bundle_file);
                cb();
            },0);
        });
    });
};

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
            }
            resolve();
        });
    })
}
