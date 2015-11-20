var gulp = require('gulp'),
    del = require('del'),
    jspm = require('../../index');

/**
 * Simplest usage of bundle with plugin
 */
gulp.task('default', ['clean'], function () {

    var targetPath = 'main.bundle.js';

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.bundle(targetPath))
        .pipe(gulp.dest('build/'));

});

/**
 * Simple arithmetic usage with bundle with plugin
 *
 * Note: It is also possible to reference modules by name as configured in config.js mappings (not shown here).
 */
gulp.task('arithmetic', ['clean'], function () {

    var expression = '- src/utils/sayHello.jsx!',
        targetPath = 'main.bundle.js';

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.arithmetic(expression))
        .pipe(jspm.bundle(targetPath))
        .pipe(gulp.dest('build/'));

});

/**
 * Alternatively, you can add arithmetic directly to the targetPath.
 */
gulp.task('arithmetic:alt', ['clean'], function () {

    var targetPath = 'main.bundle.js - src/utils/sayHello.jsx!';

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.bundle(targetPath))
        .pipe(gulp.dest('build/'));

});

/**
 * Minification is handled by the underlying jspm.Builder implementation, simply specify minify:true in builderConfig.
 */
gulp.task('minify', ['clean'], function () {

    var targetPath = 'main.bundle.min.js',
        builderConfig = {
            minify: true
        };

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.bundle(targetPath, builderConfig))
        .pipe(gulp.dest('build/'));

});

/**
 * SourceMaps are also handled by the underlying jspm.Builder implementation. By specifying
 * builderConfig.sourceMaps: true, a .map file is included with the output files.
 *
 * In this example, sourceMap.sourceRoot is assumed to be located relative to the gulp.dest path, thus actually will NOT
 * be visible when debugging in a browser as it's looking for the sources in a path where they don't actually exist.
 *
 * Ex: IF targetPath == 'main.bundle.js' AND gulp.dest('build/'), THEN sourceRoot == './build/src'
 * Ex: IF targetPath == 'out/main.bundle.js' AND gulp.dest('build/'), THEN sourceRoot == './build/src'
 */
gulp.task('sourceMap', ['clean'], function () {

    var targetPath = 'main.bundle.js',
        builderConfig = {
            sourceMaps: true
        };

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.bundle(targetPath, builderConfig))
        .pipe(gulp.dest('build/'));

});

/**
 * In this example, we specify the output directory in the targetPath thus enabling gulpJspm to configure the
 * appropriate relative sourceRoot because it knows the target directory at the time sourceMap processing occurs.
 *
 * The caveat here is that when debugging via browser, the actual sourceRoot must be accessible from the browser.
 *
 * Ex: IF targetPath == 'build/main.bundle.js' AND gulp.dest('.'), THEN sourceRoot == './src'
 * Ex: IF targetPath == 'build/out/main.bundle.js' AND gulp.dest('.'), THEN sourceRoot == './src'
 */
gulp.task('sourceMap:relative', ['clean'], function () {

    var targetPath = 'build/main.bundle.js',
        builderConfig = {
            sourceMaps: true
        };

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.bundle(targetPath, builderConfig))
        .pipe(gulp.dest('.'));

});

/**
 * In this example, we specify builderConfig.sourceMapContents: true. This option includes the source contents directly
 * in the sourceMap so you don't have to worry about the actual sourceRoot being accessible from the browser.
 */
gulp.task('sourceMap:contents', ['clean'], function () {

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.bundle('main.bundle.js', {
            sourceMaps: true,
            sourceMapContents: true
        }))
        .pipe(gulp.dest('build/'));

});

/**
 * In this example, we specify builderConfig.sourceMaps: 'inline'. This option eliminates the addition of the .map file
 * to the output and instead directly embeds it in the resulting bundle via the # sourceMappingURL= comment.
 *
 * Similar to the above example, this one also includes the source contents directly in the sourceMap, so you don't have
 * to worry about sourceRoot being accessible from the browser.
 */
gulp.task('sourceMap:inline', ['clean'], function () {

    gulp.src('src/main.jsx')
        .pipe(jspm.plugin('jsx'))
        .pipe(jspm.bundle('main.bundle.js', {
            sourceMaps: 'inline'
        }))
        .pipe(gulp.dest('build/'));

});

gulp.task('clean', function (done) {
    del(['build/']).then(function () {
        done();
    });
});