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
 * @param targetPath {String} File path for bundle output
 * @param builderConfig {Object} Configuration to pass to jspm.Builder
 */
GulpJspmApi.prototype.buildStatic = function (targetPath, builderConfig) {

    var that = this;

    if (targetPath === undefined) {
        throw new Error('targetPath param is required.');
    }

    return this.streamValidator.withObjectStream(function (entryFile, enc, push) {

        that.bundler.bundle(entryFile, targetPath, builderConfig, true).then(function (bundleFiles) {
            push(bundleFiles);
        });

    });

};

/**
 * Build a bundle via JSPM
 *
 * @param targetPath {String} File path for bundle output
 * @param builderConfig {Object} Configuration to pass to jspm.Builder
 */
GulpJspmApi.prototype.bundle = function (targetPath, builderConfig) {

    var that = this;

    if (targetPath === undefined) {
        throw new Error('targetPath param is required.');
    }

    return this.streamValidator.withObjectStream(function (entryFile, enc, push) {

        that.bundler.bundle(entryFile, targetPath, builderConfig).then(function (bundleFiles) {
            push(bundleFiles);
        });

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