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

module.exports = function(){
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

        Promise.resolve()
        .then(function(){
            return set_jspm_package_path(file.base);
        })
        .then(function(){
            return Promise.promisify(temp.open)('gulp-jspm__build.js');
        })
        .then(function(tmp_file){
            return (
                jspm.bundle(
                    file.path ,
                    tmp_file.path ,
                    {} )
                .then(function(){
                    return tmp_file.path;
                })
            );
        })
        .then(function(tmp_file_path){
            return fs.readFileAsync(tmp_file_path);
        })
        .then(function(contents){
            temp.cleanup();
            return contents;
        })
        .then(function(contents){
            var bundle_file =
                new File({
                    base: file.base,
                    path: path.join(path.dirname(file.path), 'jspm-bundle.js'),
                    contents: contents
                });
            bundle_file.original_entry_point = file;
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
