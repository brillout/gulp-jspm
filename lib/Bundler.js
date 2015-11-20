var path = require('path'),

    Promise = require('bluebird'),
    File = require('vinyl'),
    Liftoff = require('liftoff'),

    jspm = require('jspm'),

    EntryPointCalculator = require('./EntryPointCalculator');

/**
 * Bundler is a layer of abstraction on top of jspm.Builder providing convenient access to in-memory builds.
 *
 * @param entryPointCalculator
 *
 * @constructor
 */
function Bundler(entryPointCalculator) {
    this.entryPointCalculator = entryPointCalculator || new EntryPointCalculator();
}

/**
 * Launch Liftoff. Abstracted for Unit Tests.
 *
 * @param cwd {String} Current Working Directory for Liftoff
 * @param launchFn {Function} Liftoff launch callback
 * @private
 */
/* istanbul ignore next */
Bundler.prototype._withLiftoff = function (cwd, launchFn) {

    new Liftoff({
        name: 'jspm',
        configName: 'package',
        extensions: {
            '.json': null
        }
    }).launch({
        cwd: cwd // path containing jspm entry point
    }, launchFn);

};

/**
 * Fetches JSON from given path. Abstracted for Unit Tests.
 *
 * @param path
 * @returns {Object}
 * @private
 */
/* istanbul ignore next */
Bundler.prototype._fetchJSON = function (path) {
    return require(path);
};

/**
 * Fetches Builder instance. Abstracted for Unit Tests.
 *
 * @returns {Builder}
 * @private
 */
/* istanbul ignore next */
Bundler.prototype._fetchBuilder = function () {
    return new jspm.Builder();
};

/**
 * Sets JSPM Package Path. Abstracted for Unit Tests.
 *
 * @param packagePath {String}
 * @private
 */
Bundler.prototype._setJspmPackagePath = function (packagePath) {
    jspm.setPackagePath(packagePath);
};

/**
 * Parses targetPath for plugin and arithmetic.
 *
 * @param targetPath {String}
 *
 * @returns {Object}
 * @private
 */
Bundler.prototype._parseTargetPath = function (targetPath) {

    var result = {},
        targetPathSplit = (targetPath || "").split(' '),
        pluginRegex = /(.+)\!(.+)$/;

    result.targetPath = targetPathSplit.shift();

    if (pluginRegex.test(result.targetPath)) {

        var match = result.targetPath.match(pluginRegex);

        result.targetPath = match[1];
        result.plugin = match[2];

    }

    if (targetPathSplit.length > 0) { // not 1 because we called .shift();
        result.arithmetic = targetPathSplit.join(' ');
    }

    return result;

};

/**
 * Pre-configure JSPM. Must occur BEFORE `new jspm.Builder()`
 *
 * @returns {Promise} resolved with configPaths
 * @private
 */
Bundler.prototype._configureJspm = function (entryFile) {

    var that = this;

    return new Promise(function (resolve) { // configure JSPM packagePath

        that._withLiftoff(entryFile.base, function (env) {

            that._setJspmPackagePath(env.configBase); // set package.json path

            var packageJSON = that._fetchJSON(env.configPath),
                configPaths = {
                    configBase: env.configBase,
                    jspmRoot: env.configBase
                };

            if (packageJSON && packageJSON.jspm && packageJSON.jspm.directories) { // respect jspm.directories config
                configPaths.jspmRoot = path.join(env.configBase, (packageJSON.jspm.directories.baseURL || ''));
            }

            resolve(configPaths);

        });

    });

};

/**
 * Higher-order function. Creates a Promise callback that takes configPaths as input and uses the builder to create the
 * bundle; returning a Promise resolved with [builderResults, configPaths].
 *
 * @param entryFile {Vinyl} Bundle EntryPoint
 * @param builderConfig {Object}
 * @param sfx {Boolean} Self-Executing Bundle
 *
 * @returns {Function} Promise Callback
 * @private
 */
Bundler.prototype._createBundle = function (entryFile, builderConfig, sfx) {

    var that = this;

    return function (configPaths) {

        var builder = that._fetchBuilder(),
            entryPoint = that.entryPointCalculator.calc(entryFile, configPaths.jspmRoot);

        // Builder functions return Promises
        return [builder[sfx ? 'buildStatic' : 'bundle'](entryPoint, builderConfig), Promise.resolve(configPaths)];

    }

};

/**
 * Higher-order function. Creates a Promise spread callback that takes builderResults and configPaths as input and
 * processes the builderResults.sourceMap entries to produce the appropriate output; returning a promise resolved with
 * an array of Vinyl files [bundle, sourceMap?]
 *
 * @param entryFile {Vinyl} Bundle EntryPoint
 * @param targetPath {String} Bundle targetPath
 *
 * @returns {Function} Promise Spread Callback
 * @private
 */
Bundler.prototype._processSourceMap = function (entryFile, targetPath) {

    return function (builderResults, configPaths) {

        var bundleFile = new File({
                base: entryFile.base,
                path: path.join(entryFile.base, targetPath),
                contents: new Buffer(builderResults.source)
            }),

            sourceMapFile = new File({
                base: entryFile.base,
                path: path.join(path.dirname(entryFile.path), targetPath + '.map')
            });

        if (builderResults.sourceMap) { // sourceMaps: true (NOT "inline")

            var sourceMap = JSON.parse(builderResults.sourceMap);

            sourceMap.file = bundleFile.basename; // set the file

            sourceMap.sourceRoot = path.relative( // set the sourceRoot
                path.join(configPaths.configBase, path.dirname(targetPath)),
                entryFile.base
            );

            // update sources to take sourceRoot into account
            sourceMap.sources = sourceMap.sources.map(function (source) {

                return path.relative(

                    // from: relative sourceRoot
                    sourceMap.sourceRoot,

                    // to: calculated source path (relative from targetPath)
                    path.relative(
                        path.join(configPaths.configBase, path.dirname(targetPath)),
                        path.resolve(source)
                    )

                );

            });

            // update sourceMapFile contents
            sourceMapFile.contents = new Buffer(JSON.stringify(sourceMap));

            // append "//# sourceMappingURL=..."
            bundleFile.contents = Buffer.concat([
                bundleFile.contents,
                new Buffer("\n//# sourceMappingURL=" + sourceMapFile.basename)
            ]);

            return [bundleFile, sourceMapFile];

        } else {
            return [bundleFile];
        }

    }

};

/**
 * Generate the jspm bundle.
 *
 * @param entryFile {Vinyl} Bundle entry point.
 * @param targetPath {String} Output path for resulting bundleFile.
 * @param builderConfig {Object} Configuration to be passed to jspm.Builder
 * @param sfx {boolean} Self-Executing Bundle
 *
 * @returns {Promise} resolved with bundleFiles (Array[Vinyl])
 */
Bundler.prototype.bundle = function (entryFile, targetPath, builderConfig, sfx) {

    var targetInfo = this._parseTargetPath(targetPath);

    entryFile.jspm = entryFile.jspm || {};
    entryFile.jspm.plugin = targetInfo.plugin || entryFile.jspm.plugin;
    entryFile.jspm.arithmetic = targetInfo.arithmetic || entryFile.jspm.arithmetic;

    // input -> resolvedWith
    return this._configureJspm(entryFile) // -> configPaths
        .then(this._createBundle(entryFile, builderConfig, sfx)) // configPaths -> builderResults, configPaths
        .spread(this._processSourceMap(entryFile, targetInfo.targetPath)); // builderResults, configPaths -> bundleFiles

};

module.exports = Bundler;