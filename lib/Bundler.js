var os = require('os'),
    path = require('path'),
    upath = require('upath'),
    url = require('url'),
    multimatch = require('multimatch'),

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

    var builder = new jspm.Builder(),
        originalNormalize = builder.loader.normalize;

    builder.loader.normalize = function (name, parentName, parentAddress) {

        var newParentName = parentName ? parentName.replace(/\\/g, '/') : parentName,
            newParentAddress = parentAddress ? parentAddress.replace(/\\/g, '/') : parentAddress;

        return originalNormalize.call(this, name, newParentName, newParentAddress);

    };

    return builder;

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

Bundler.prototype._fetchEntryFile = function (entryPath, fileCache) {

    for (var x = 0; x < fileCache.length; x++) {

        if (multimatch(path.relative(fileCache[x].cwd, fileCache[x].path), entryPath).length > 0) {
            return fileCache[x];
        }
    }

    throw Error("Error: entryFile not found in stream.")

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
        return builder[sfx ? 'buildStatic' : 'bundle'](entryPoint, builderConfig);

    }

};

/**
 * Higher-order function. Creates a Promise spread callback that takes builderResults and configPaths as inputs
 * and processes the builderResults to produce the appropriate output; returning a promise resolved with an array of
 * Vinyl files [bundle]
 *
 * @param entryFile {Vinyl} Bundle EntryPoint
 * @param targetPath {String} Bundle targetPath
 *
 * @returns {Function} Promise Callback
 * @private
 */
Bundler.prototype._processWithoutSourceMap = function (entryFile, targetPath) {

    return function (builderResults, configPaths) {

        var bundleFile = new File({
                base: path.join(entryFile.base, path.dirname(targetPath)),
                path: path.join(entryFile.base, targetPath)
            });

        bundleFile.contents = new Buffer(builderResults.source);

        return [bundleFile];

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
 * @returns {Function} Promise Callback
 * @private
 */
Bundler.prototype._processWithSourceMap = function (entryFile, targetPath) {

    return function (builderResults, configPaths) {

        var bundleFile = new File({
                base: path.join(entryFile.base, path.dirname(targetPath)),
                path: path.join(entryFile.base, targetPath)
            }),

            sourceMapFile = new File({
                base: path.join(entryFile.base, path.dirname(targetPath)),
                path: path.join(entryFile.base, targetPath + '.map')
            }),

            isStandaloneSourceMap = !!builderResults.sourceMap,

            sourceMap;

        if (isStandaloneSourceMap) {
            sourceMap = JSON.parse(builderResults.sourceMap);
        } else {

            var sourceMappingUrlRegex = /\/\/# sourceMappingURL=(.+)/,
                sourceMappingUrlMatches = sourceMappingUrlRegex.exec(builderResults.source),
                sourceMappingUrl = sourceMappingUrlMatches ? sourceMappingUrlMatches[1] : null,

                dataRegex = /^data:(.+);(.+),(.+)/,
                dataMatches = sourceMappingUrl ? dataRegex.exec(sourceMappingUrl) : null,

                isDataUri = dataMatches && dataMatches.length === 4,

                contentType = isDataUri ? dataMatches[1] : null,
                encoding = isDataUri ? dataMatches[2] : null,
                data = isDataUri ? dataMatches[3] : null;

            if (isDataUri && contentType === 'application/json') {
                sourceMap = JSON.parse(new Buffer(data, encoding).toString('utf8'));
            }

        }

        if (sourceMap) {

            sourceMap.file = bundleFile.basename;

            if (isStandaloneSourceMap) {

                // update sourceMapFile contents
                sourceMapFile.contents = new Buffer(JSON.stringify(sourceMap));

                // append "//# sourceMappingURL=..."
                bundleFile.contents = Buffer.concat([
                    new Buffer(builderResults.source),
                    new Buffer("\n//# sourceMappingURL=" + sourceMapFile.basename)
                ]);

                return [bundleFile, sourceMapFile];

            } else {

                bundleFile.contents = new Buffer(
                    builderResults.source.replace(
                        /(\/\/# sourceMappingURL=data:)(.+);(.+),(.+)$/,
                        '$1$2;$3,' + new Buffer(JSON.stringify(sourceMap)).toString('base64')
                    )
                );

            }

        }

        return [bundleFile];

    }

};

/**
 * Generate the jspm bundle.
 *
 * @param entryPath {String} Path for entry point.
 * @param targetPath {String} Output path for resulting bundleFile.
 * @param builderConfig {Object} Configuration to be passed to jspm.Builder
 * @param fileCache {Array<Vinyl>} Array of vinyl files from a stream
 * @param sfx {boolean} Self-Executing Bundle
 *
 * @returns {Promise} resolved with bundleFiles (Array[Vinyl])
 */
Bundler.prototype.bundle = function (entryPath, targetPath, builderConfig, fileCache, sfx) {

    builderConfig = builderConfig || {};

    var targetInfo = this._parseTargetPath(targetPath),
        entryFile = this._fetchEntryFile(entryPath, fileCache),
        originalFetch = builderConfig.fetch || function (load, fetch) { return fetch(load); };

    builderConfig.fetch = function (load, fetch) {

        var loadPath = os.platform() === 'win32' ? url.parse(load.name).path.replace(/^\/(.+)$/, '$1') : url.parse(load.name).path;

        for (var x = 0; x < fileCache.length; x++) {
            if (fileCache[x].path === path.normalize(loadPath)) {
                return String(fileCache[x].contents);
            }
        }

        return originalFetch(load, fetch);

    };

    entryFile.jspm = entryFile.jspm || {};
    entryFile.jspm.plugin = targetInfo.plugin || entryFile.jspm.plugin;
    entryFile.jspm.arithmetic = targetInfo.arithmetic || entryFile.jspm.arithmetic;

    // input -> resolvedWith
    var results = this._configureJspm(entryFile) // -> configPaths
        .then(this._createBundle(entryFile, builderConfig, sfx)); // configPaths -> builderResults, configPaths

    if (builderConfig.sourceMaps) {

        return results
            .then(this._processWithSourceMap(entryFile, targetInfo.targetPath)); // builderResults, configPaths -> bundleFiles

    } else {

        return results
            .then(this._processWithoutSourceMap(entryFile, targetInfo.targetPath)); // builderResults, configPaths -> bundleFiles

    }


};

module.exports = Bundler;
