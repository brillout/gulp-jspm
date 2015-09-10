var Liftoff = require('liftoff');
var jspm; // jspm module loaded with Liftoff
var through = require('through2');
var assert = require('mini-assert');
var Promise = require('bluebird');
Promise.longStackTraces();
var temp = require('temp').track();
var File = require('vinyl');
var fs = Promise.promisifyAll(require("fs"));
var path = require('path');


module.exports = function(){
    return through.obj(function(file, enc, cb){

        var stream_push = this.push.bind(this);

        assert(file.base);
        assert(file.code_info.location.uri);

        Promise.resolve()
        .then(function(){
            return load_jspm_module(file.base);
        })
        .then(function(){
            return Promise.promisify(temp.open)('gulp-jspm__build.js');
        })
        .then(function(tmp_file){
            return (
                jspm.bundle(
                    file.code_info.location.uri ,
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
            return new File({
                base: file.base,
                path: path.join(path.dirname(file.path), 'jspm-bundle.js'),
                contents: contents
            });
        })
        .then(function(bundle_file){
            stream_push(bundle_file);
            stream_push(file);
            cb();
        });

    });
};

function load_jspm_module(directory){
    return new Promise(function(resolve){
        if( jspm ) {
            resolve();
            return;
        }

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

            if (env.modulePath) {
                jspm = require(env.modulePath);
                process.env.globalJspm = true;
            }
            else {
                jspm = require('jspm');
                process.env.globalJspm = false;
            }

            if( env.configBase ) {
                jspm.setPackagePath(env.configBase);
            }

            resolve();

        });

    })
}
