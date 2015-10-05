var assert = require("better-assert");
var stream_assert = require("./stream-assert.js");
var gulp = require('gulp');
var gulp_jspm = require('../index.js');
var through2 = require('through2');
var path = require('path');
var fs = require('fs');
require('mocha');


var script_path = path.resolve(__dirname,'../demo/src/main.js');

describe('test setup', function() {
    var content;

    it('should have the ES2015 test script', function() {
        content = fs.readFileSync(script_path).toString();
    });

    it('test script should import message.js', function() {
        assert( /import.*message/.test(content) );
    });

});

describe('gulp_jspm()', function() {

    var stream = gulp.src(script_path);

    it('should not throw any errors', function(done) {
        this.timeout(4000);
        stream =
            stream
            .pipe(through2.obj(function(file, enc, cb){
                file.sourceMap = true;
                this.push(file);
                cb();
            }))
            .pipe(gulp_jspm())
            .pipe(stream_assert.done(done));
    });

    it('should return one file', function(done) {
        stream =
            stream
            .pipe(stream_assert.length(1))
            .pipe(stream_assert.done(done));
    });

    it("should return the bundle's content", function(done){
        stream =
            stream
            .pipe(stream_assert.test(function(bundle_file) {
                assert( bundle_file.contents );
                assert( /System\.register\("main.js".*message/.test( bundle_file.contents ) );
                assert( /System\.register\("message.js"/.test( bundle_file.contents.toString() ) );
            }))
            .pipe(stream_assert.done(done));
    });

    it("should return the bundle's source map", function(done){
        stream =
            stream
            .pipe(stream_assert.test(function(bundle_file) {
                assert( bundle_file.sourceMap );
                assert( bundle_file.sourceMap.sources );
                assert( bundle_file.sourceMap.sources.indexOf( 'main.js' ) !== -1 );
                assert( bundle_file.sourceMap.sources.indexOf( 'message.js' ) !== -1 );
            }))
            .pipe(stream_assert.done(done));
    });

    it("should prepend `.bundle` to filename extension", function(done){
        stream =
            stream
            .pipe(stream_assert.test(function(bundle_file) {
                assert( bundle_file.relative === 'main.bundle.js' );
            }))
            .pipe(stream_assert.done(done));
    });

    it("should support arithmetics", function(done){
        gulp.src(script_path)
            .pipe(gulp_jspm({arithmetic:'   - message  '}))
            .pipe(stream_assert.test(function(bundle_file) {
                assert( bundle_file.contents );
                assert( /System\.register\("main.js".*message/.test( bundle_file.contents ) );
                assert( ! /System\.register\("message.js"/.test( bundle_file.contents.toString() ) );
            }))
            .pipe(stream_assert.done(done));
    });

});
