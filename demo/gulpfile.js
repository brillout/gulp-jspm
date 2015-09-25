var gulp = require('gulp');
var gulp_jspm = require('../index.js');


gulp.task('default', function(){
    return gulp.src('src/main.js')
        .pipe(gulp_jspm())
        .pipe(gulp.dest('build/'));
});


gulp.task('sourcemap', function(){
    var sourcemaps = require('gulp-sourcemaps');

    return gulp.src('src/main.js')
        .pipe(sourcemaps.init())
        .pipe(gulp_jspm())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build/'));
});


gulp.task('test', function(){
    var assert = require('better-assert');

    return gulp.src('src/main.js')
        .pipe(gulp_jspm())
        .pipe(pass(function(vinyl_file){
            assert( vinyl_file.relative === 'jspm-bundle.js' );
            assert( vinyl_file.original_entry_point.relative === 'main.js' );
        }));

    function pass(fct) {
        return require('through2').obj(function(file, enc, cb){
            fct(file);
            this.push(file);
            cb();
        });
    }
});


gulp.task('arithmetic', function(){
    return gulp.src('src/main.js')
        .pipe(gulp_jspm('- message'))
        .pipe(gulp.dest('build/'));
});
