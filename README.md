# gulp-jspm

In-Memory builds with JSPM via Gulp, designed to reflect the JSPM/SystemJS Builder API.

See: 
https://github.com/jspm/jspm-cli/blob/master/docs/api.md#class-builder
https://github.com/systemjs/builder#in-memory-builds

**Note:** 1.x versions are incompatible with 0.x. Please update your gulpfile if upgrading.

## Quick Start

Install via npm:

`npm install gulp-jspm --save-dev`

Include in gulpfile:

> gulpfile.js
>
>```javascript
>var gulp = require('gulp'),
>    jspm = require('gulp-jspm');
>    
>    gulp.task('jspm', function () {
>       
>        return gulp.src('src/main.js')
>
>            // use a jspm plugin (must be called before bundle or buildStatic)
>            // .pipe(jspm.plugin(name))
>
>            // use bundle arithmetic (must be called before bundle or buildStatic)
>            // .pipe(jspm.arithmetic(expression))
>
>            // bundle
>            // .pipe(jspm.bundle(targetPath, builderConfig))
>
>            // self-executing build
>            .pipe(jspm.buildStatic(targetPath, builderConfig))
>
>            .pipe(gulp.dest('build/'));
>        
>    });
>```

## API

### .plugin(name)

Configure JSPM to use a plugin. Note: Must be called BEFORE .bundle or .buildStatic.

`name` String
- JSPM plugin name. Ex: 'jsx', would tell jspm to use the jsx compiler plugin assuming its properly installed/configured.

### .arithmetic(expression)

Configure JSPM to use arithmetic. Note: Must be called BEFORE .bundle or .buildStatic.

`expression` String
- JSPM Arithmetic Expression. Ex: '- message', would remove the message module from the ensuing bundle.
 
### .bundle(targetPath, builderConfig)

`targetPath` String
- Path to bundled output will be written to disk relative to target from `gulp.dest(target)`. 
  Ex: `main.bundle.js` or `build/main.bundle.js`.

`builderConfig` Object
- SystemJS Builder configuration. Reference: https://github.com/systemjs/builder
  Ex: sourceMaps, lowResSourceMaps, minify, mangle, sourceMapContents, etc... 

### .buildStatic(targetPath, builderConfig)

`targetPath` String
- Path to bundled output will be written to disk relative to target from `gulp.dest(target)`. 
  Ex: `main.bundle.js` or `build/main.bundle.js`.

`builderConfig` Object
- SystemJS Builder configuration. Reference: https://github.com/systemjs/builder
  Ex: sourceMaps, lowResSourceMaps, minify, mangle, sourceMapContents, etc...
  
## Error Handling

```javascript
gulp.src('src/main.js')
    .pipe(jspm.bundle('main.bundle.js')
        .on('error', jspm.logError)
    )
```

## Examples

First, cd to the example dir:
- `cd examples/$example`

Then install npm dependencies:
- `npm install`

Examine `gulpfile.js`, then execute a gulp task:
- `gulp $task`

Examine `build/` directory output or view `./index.html` in browser.