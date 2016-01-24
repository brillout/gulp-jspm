var Bundler = require('./Bundler'),
    StreamValidator = require('./StreamValidator');

/**
 * Gulp API Class
 *
 * @param bundler
 * @param streamValidator
 *
 * @constructor
 */
function GulpJspmApi(bundler, streamValidator) {
    this.bundler = bundler || new Bundler();
    this.streamValidator = streamValidator || new StreamValidator();
}

/**
 * Configure GulpJSPM to use a JSPM Plugin
 *
 * @param name {String} Plugin name
 */
GulpJspmApi.prototype.plugin = function (name) {

    return this.streamValidator.withObjectStream(function (file, enc, push) {
        file.jspm.plugin = name;
        push(file);
    });

};

/**
 * Configure GulpJSPM to use Bundle Arithmetic
 *
 * @param expression {String} Bundle Arithmetic Expression
 */
GulpJspmApi.prototype.arithmetic = function (expression) {

    return this.streamValidator.withObjectStream(function (file, enc, push) {
        file.jspm.arithmetic = expression;
        push(file);
    });

};

/**
 * Build a self-executing Bundle via JSPM.
 *
 * @param entryPath {String} Path of entry point for bundle
 * @param targetPath {String} File path for bundle output
 * @param builderConfig {Object} Configuration to pass to jspm.Builder
 */
GulpJspmApi.prototype.buildStatic = function (entryPath, targetPath, builderConfig) {

    var that = this,
        streamCache = [];

    if (entryPath === undefined) {
        throw new Error('entryPath param is required.');
    }

    if (targetPath === undefined) {
        throw new Error('targetPath param is required.');
    }

    return this.streamValidator.withObjectStream(function (file, enc, flush) {

        streamCache.push(file);
        flush();

    }, function (flush) {

        that.bundler.bundle(entryPath, targetPath, builderConfig, streamCache, true).then(function (bundleFiles) {

            if (Array.isArray(bundleFiles)) {

                for (var x = 0; x < bundleFiles.length; x++) {
                    this.push(bundleFiles[x]);
                }

            } else {
                this.push(bundleFiles);
            }

            flush();

        }.bind(this));

    });

};

/**
 * Build a bundle via JSPM
 *
 * @param entryPath {String} Path of entry point for bundle
 * @param targetPath {String} File path for bundle output
 * @param builderConfig {Object} Configuration to pass to jspm.Builder
 */
GulpJspmApi.prototype.bundle = function (entryPath, targetPath, builderConfig) {

    var that = this,
        fileCache = [];

    if (entryPath === undefined) {
        throw new Error('entryPath param is required.');
    }

    if (targetPath === undefined) {
        throw new Error('targetPath param is required.');
    }

    return this.streamValidator.withObjectStream(function (file, enc, flush) {

        fileCache.push(file);
        flush();

    }, function (flush) {

        that.bundler.bundle(entryPath, targetPath, builderConfig, fileCache).then(function (bundleFiles) {

            if (Array.isArray(bundleFiles)) {

                for (var x = 0; x < bundleFiles.length; x++) {
                    this.push(bundleFiles[x]);
                }

            } else {
                this.push(bundleFiles);
            }

            flush();

        }.bind(this));

    });

};

/**
 * Helper method to log errors.
 *
 * @param error
 */
GulpJspmApi.prototype.logError = function (error) {
    process.stderr.write(error.toString() + '\n');
};

module.exports = GulpJspmApi;