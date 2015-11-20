var PluginError = require('gulp-util').PluginError,

    PROJECT_NAME = require('../package.json').name;

function StreamValidator(through2) {
    this.through2 = through2 || require('through2');
}

/**
 * Validates a through2 object stream and executes objectStreamFn callback with parameters.
 *
 * The push callback passed to objectStreamFn is an async done callback that can be passed
 * either one or an array of vinyl files as parameters. These are files that need to be added back to the stream handlers.
 *
 * @param objectStreamFn {Function} called with (file {Vinyl}, enc {String}, push {Function})
 */
StreamValidator.prototype.withObjectStream = function (objectStreamFn) {

    var that = this;

    return that.through2.obj(function (file, enc, done) {

        if (file.isNull()) { // read: false

            this.emit('error', new PluginError(PROJECT_NAME, 'File contents must be read to proceed. Are you using {read: false}?'));

            return done();

        }

        if (file.isStream()) { // buffer: false

            this.emit('error', new PluginError(PROJECT_NAME, 'Streams are not supported.'));

            return done();

        }

        if (file.isBuffer()) { // read: true, buffer: true

            var that = this;

            file.jspm = file.jspm || {};

            objectStreamFn(file, enc, function (bundleFiles) {

                if (Array.isArray(bundleFiles)) {

                    for (var x = 0; x < bundleFiles.length; x++) {
                        that.push(bundleFiles[x]);
                    }

                } else {
                    that.push(bundleFiles);
                }

                done();

            });

        } else { // unknown condition

            this.emit('error', new PluginError(PROJECT_NAME, 'File contents must be read as buffer to proceed.'));

            return done();

        }

    });

};

module.exports = StreamValidator;