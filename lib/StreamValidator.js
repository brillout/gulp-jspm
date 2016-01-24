var PluginError = require('gulp-util').PluginError,

    PROJECT_NAME = require('../package.json').name;

function StreamValidator(through2) {
    this.through2 = through2 || require('through2');
}

/**
 * Validates a through2 object stream and executes objectStreamFn callback with parameters.
 *
 * @param objectStreamFn {Function} called with (file {Vinyl}, enc {String}, flush {Function})
 * @param flushFn {Function} called with (flush {Function}). The through2 flush callback
 */
StreamValidator.prototype.withObjectStream = function (objectStreamFn, flushFn) {

    var that = this;

    return that.through2.obj(function (file, enc, flush) {

        if (file.isNull()) { // read: false

            this.emit('error', new PluginError(PROJECT_NAME, 'File contents must be read to proceed. Are you using {read: false}?'));

            return flush();

        }

        if (file.isStream()) { // buffer: false

            this.emit('error', new PluginError(PROJECT_NAME, 'Streams are not supported.'));

            return flush();

        }

        if (file.isBuffer()) { // read: true, buffer: true

            objectStreamFn.call(this, file, enc, flush);

        } else { // unknown condition

            this.emit('error', new PluginError(PROJECT_NAME, 'File contents must be read as buffer to proceed.'));

            return flush();

        }

    }, function (flush) {

        if (flushFn) {
            flushFn.call(this, flush);
        } else {
            flush();
        }

    });

};

module.exports = StreamValidator;