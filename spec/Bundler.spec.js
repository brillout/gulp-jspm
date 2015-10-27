var path = require('path'),

    File = require('vinyl'),
    Promise = require('bluebird'),

    Bundler = require('../lib/Bundler');

describe('Bundler', function () {

    beforeEach(function () {

        this.bundleName = 'bundle.js';

        this.entryFile = new File({
            base: '/src',
            path: '/src/entryFile.js'
        });

        this.bundleFile = new File({
            base: '/src',
            path: '/src/' + this.bundleName
        });

        this.sourceMapFile = new File({
            base: '/src',
            path: '/src/' + this.bundleName + '.map'
        });

    });

    describe('._parseTargetPath(targetPath)', function () {

        it('should return an Object', function () {

            // given
            var bundler = new Bundler(),
                result;

            // when
            result = bundler._parseTargetPath();

            // then
            expect(typeof result).toBe('object');

        });

        it('return object should contain targetPath entry', function () {

            // given
            var bundler = new Bundler(),
                targetPath = this.bundleName,

                result;

            // when
            result = bundler._parseTargetPath(targetPath);

            // then
            expect(result.targetPath).toBeDefined();
            expect(result.targetPath).toEqual(targetPath);

        });

        describe('if targetPath contains plugin syntax', function () {

            it('return object should contain plugin entry', function () {

                // given
                var bundler = new Bundler(),
                    targetPath = this.bundleName + '!jsx',

                    result;

                // when
                result = bundler._parseTargetPath(targetPath);

                // then
                expect(result.plugin).toBeDefined();
                expect(result.plugin).toEqual('jsx');

            });

            it('return object should contain targetPath entry', function () {

                // given
                var bundler = new Bundler(),
                    targetPath = this.bundleName + '!jsx',

                    result;

                // when
                result = bundler._parseTargetPath(targetPath);

                // then
                expect(result.targetPath).toEqual(this.bundleName);

            });

        });

        describe('if targetPath DOES NOT contain plugin syntax', function () {

            it('return object should NOT contain plugin entry', function () {

                // given
                var bundler = new Bundler(),
                    targetPath = this.bundleName,

                    result;

                // when
                result = bundler._parseTargetPath(targetPath);

                // then
                expect(result.plugin).toBeUndefined();

            });

        });

        describe('if targetPath contains arithmetic syntax', function () {

            it('return object should contain arithmetic entry', function () {

                // given
                var bundler = new Bundler(),
                    targetPath = this.bundleName + ' - module',

                    result;

                // when
                result = bundler._parseTargetPath(targetPath);

                // then
                expect(result.arithmetic).toBeDefined();
                expect(result.arithmetic).toEqual('- module');

            });

        });

        describe('if targetPath DOES NOT contain arithmetic syntax', function () {

            it('return object should NOT contain arithmetic entry', function () {

                // given
                var bundler = new Bundler(),
                    targetPath = this.bundleName,

                    result;

                // when
                result = bundler._parseTargetPath(targetPath);

                // then
                expect(result.arithmetic).toBeUndefined();

            });

        });

    });

    describe('._configureJspm(entryFile)', function () {

        it('should call ._setJspmPackagePath with liftoff env.configBase', function () {

            // given
            var bundler = new Bundler();

            spyOn(bundler, '_withLiftoff').and.callFake(function (cwd, launchFn) {
                launchFn({
                    // env
                    configBase: '/config/base'
                })
            });

            spyOn(bundler, '_fetchJSON').and.returnValue({});
            spyOn(bundler, '_setJspmPackagePath');

            // when
            bundler._configureJspm(this.entryFile);

            // then
            expect(bundler._setJspmPackagePath).toHaveBeenCalledWith('/config/base');

        });

        describe('if package.json entry: jspm.directories.baseURL', function () {

            it('is specified, configPaths.jspmRoot should be updated to reflect the entry', function (done) {

                // given
                var bundler = new Bundler();

                spyOn(bundler, '_withLiftoff').and.callFake(function (cwd, launchFn) {
                    launchFn({
                        // env
                        configBase: '/config/base'
                    })
                });

                spyOn(bundler, '_fetchJSON').and.returnValue({
                    // package.json
                    jspm: {
                        directories: {
                            baseURL: 'src'
                        }
                    }
                });

                // when
                bundler._configureJspm(this.entryFile).then(function (configPaths) {

                    // then
                    expect(configPaths.jspmRoot).toBe('/config/base/src');
                    done();

                });

            });

            it('is NOT specified, configPaths.jspmRoot should default to liftoff env.configBase', function (done) {

                // given
                var bundler = new Bundler();

                spyOn(bundler, '_withLiftoff').and.callFake(function (cwd, launchFn) {
                    launchFn({
                        configBase: '/config/base'
                    })
                });

                spyOn(bundler, '_fetchJSON').and.returnValue({});

                // when
                bundler._configureJspm(this.entryFile).then(function (configPaths) {

                    // then
                    expect(configPaths.jspmRoot).toBe('/config/base');
                    done();

                });

            });

            it('is NOT specified AND jspm.directories is defined, doesnt throw an error', function () {

                // given
                var bundler = new Bundler(),
                    that = this;

                spyOn(bundler, '_withLiftoff').and.callFake(function (cwd, launchFn) {
                    launchFn({
                        configBase: '/config/base'
                    })
                });

                spyOn(bundler, '_fetchJSON').and.returnValue({
                    jspm: {
                        directories: {}
                    }
                });

                // when
                expect(function () {
                    bundler._configureJspm(that.entryFile)
                }).not.toThrow();

            });

        });

    });

    describe('._createBundle(entryFile, builderConfig, sfx)', function () {

        it('should return a function', function () {

            // given
            var bundler = new Bundler(),
                result;

            // when
            result = bundler._createBundle(this.entryFile);

            // then
            expect(typeof result).toBe('function');

        });

        describe('returned function, when called', function () {

            it('should calculate the entryPoint via the EntryPointCalculator', function () {

                // given
                var entryPointCalculator = jasmine.createSpyObj('entryPointCalculator', ['calc']),
                    bundler = new Bundler(entryPointCalculator),

                    configPaths = {
                        jspmRoot: '/jspm/root'
                    };

                spyOn(bundler, '_fetchBuilder').and.callFake(function () {
                    return jasmine.createSpyObj('builder', ['buildStatic', 'bundle']);
                });

                // when
                bundler._createBundle(this.entryFile)(configPaths);

                // then
                expect(entryPointCalculator.calc).toHaveBeenCalledWith(this.entryFile, configPaths.jspmRoot);

            });

            it('if sfx=true, should call builder.buildStatic method with calculated entryPoint and builderConfig', function () {

                // given
                var entryPointCalculator = jasmine.createSpyObj('entryPointCalculator', ['calc']),

                    bundler = new Bundler(entryPointCalculator),
                    builder = jasmine.createSpyObj('builder', ['buildStatic', 'bundle']),

                    entryPoint = 'entryPoint',
                    configPaths = {
                        jspmRoot: '/jspm/root'
                    },

                    builderConfig = {},
                    sfx = true;

                entryPointCalculator.calc.and.callFake(function () {
                    return entryPoint;
                });

                spyOn(bundler, '_fetchBuilder').and.callFake(function () {
                    return builder;
                });

                // when
                bundler._createBundle(this.entryFile, builderConfig, sfx)(configPaths);

                // then
                expect(builder.buildStatic).toHaveBeenCalledWith(entryPoint, builderConfig);

            });

            it('if sfx=false, should call builder.bundle method with calculated entryPoint and builderConfig', function () {

                // given
                var entryPointCalculator = jasmine.createSpyObj('entryPointCalculator', ['calc']),

                    bundler = new Bundler(entryPointCalculator),
                    builder = jasmine.createSpyObj('builder', ['buildStatic', 'bundle']),

                    entryPoint = 'entryPoint',
                    configPaths = {
                        jspmRoot: '/jspm/root'
                    },

                    builderConfig = {},
                    sfx = false;

                entryPointCalculator.calc.and.callFake(function () {
                    return entryPoint;
                });

                spyOn(bundler, '_fetchBuilder').and.callFake(function () {
                    return builder;
                });

                // when
                bundler._createBundle(this.entryFile, builderConfig, sfx)(configPaths);

                // then
                expect(builder.bundle).toHaveBeenCalledWith(entryPoint, builderConfig);

            });

            it('should return an array of: [builderResults, configPaths]', function (done) {

                // given
                var entryPointCalculator = jasmine.createSpyObj('entryPointCalculator', ['calc']),
                    bundler = new Bundler(entryPointCalculator),
                    builder = jasmine.createSpyObj('builder', ['buildStatic', 'bundle']),

                    builderResults = {
                        results: true
                    },
                    configPaths = {
                        jspmRoot: '/jspm/root'
                    },

                    results;

                spyOn(bundler, '_fetchBuilder').and.callFake(function () {
                    return builder;
                });

                builder.buildStatic.and.returnValue(Promise.resolve(builderResults));
                builder.bundle.and.returnValue(Promise.resolve(builderResults));

                // when
                results = bundler._createBundle(this.entryFile)(configPaths);

                // then
                expect(Array.isArray(results)).toBeTruthy();
                expect(results.length).toBe(2);

                expect(results[0].then).toBeDefined();
                expect(results[1].then).toBeDefined();

                Promise.resolve(results).spread(function (_builderResults, _configPaths) {

                    expect(_builderResults).toBe(builderResults);
                    expect(_configPaths).toBe(configPaths);

                    done();

                });

            });

        });

    });

    describe('._processSourceMap(entryFile, targetPath)', function () {

        it('should return a function', function () {

            // given
            var bundler = new Bundler(),

                targetPath = this.bundleName,
                result;

            // when
            result = bundler._processSourceMap(this.entryFile, targetPath);

            // then
            expect(typeof result).toBe('function');


        });

        describe('returned function, when called', function () {

            it('if builderResults.sourceMap is falsy, returns only the bundleFile', function () {

                // given
                var bundler = new Bundler(),

                    builderResults = {
                        sourceMap: false,
                        source: ""
                    },
                    configPaths = {
                        jspmRoot: '/jspm/root'
                    },

                    targetPath = this.bundleName,
                    result;

                // when
                result = bundler._processSourceMap(this.entryFile, targetPath)(builderResults, configPaths);

                // then
                expect(Array.isArray(result)).toBeTruthy();
                expect(result.length).toBe(1);
                expect(result[0].path).toMatch(new RegExp(this.bundleFile.basename + "$"));

            });

            describe('if builderResults.sourceMap is truthy, ', function () {

                it('should update sourceMap.file with bundleFile.basename', function () {

                    // given
                    var bundler = new Bundler(),

                        builderResults = {
                            sourceMap: '{"sources": []}',
                            source: ""
                        },
                        configPaths = {
                            configBase: '/jspm/root',
                            jspmRoot: '/jspm/root'
                        },

                        targetPath = this.bundleName,
                        result;

                    // when
                    result = bundler._processSourceMap(this.entryFile, targetPath)(builderResults, configPaths);

                    // then
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result.length).toBe(2);

                    expect(result[1].path).toMatch(new RegExp(this.sourceMapFile.basename + "$"));
                    expect(JSON.parse(result[1].contents.toString())).toEqual(jasmine.objectContaining({
                        file: this.bundleFile.basename
                    }));

                });

                it('should update sourceMap.sourceRoot with a path relative from targetPath to entryFile.base', function () {

                    // given
                    var bundler = new Bundler(),

                        builderResults = {
                            sourceMap: '{"sources": []}',
                            source: ""
                        },
                        configPaths = {
                            configBase: '/jspm/root',
                            jspmRoot: '/jspm/root'
                        },

                        targetPath = this.bundleName,
                        result;

                    // when
                    result = bundler._processSourceMap(this.entryFile, targetPath)(builderResults, configPaths);

                    // then
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result.length).toBe(2);

                    expect(result[1].path).toMatch(new RegExp(this.sourceMapFile.basename + "$"));
                    expect(JSON.parse(result[1].contents.toString())).toEqual(jasmine.objectContaining({

                        sourceRoot: path.relative(
                            path.join(configPaths.configBase, path.dirname(targetPath)),
                            this.entryFile.base
                        )

                    }));

                });

                it('should update sourceMap.sources to contain paths relative to sourceMap.sourceRoot', function () {

                    // given
                    var bundler = new Bundler(),

                        builderResults = {
                            sourceMap: '{"sources": ["/src/nest/entryFile.js"]}',
                            source: ""
                        },
                        configPaths = {
                            configBase: '/',
                            jspmRoot: '/'
                        },

                        targetPath = 'build/' + this.bundleName,
                        result;

                    // when
                    result = bundler._processSourceMap(this.entryFile, targetPath)(builderResults, configPaths);

                    // then
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result.length).toBe(2);

                    expect(result[1].path).toMatch(new RegExp(this.sourceMapFile.basename + "$"));
                    expect(JSON.parse(result[1].contents)).toEqual(
                        jasmine.objectContaining({

                            sources: [

                                // 'nest/entryFile.js'
                                path.relative(
                                    path.relative( // === sourceMap.sourceRoot === '../src'
                                        path.join(configPaths.configBase, path.dirname(targetPath)),
                                        this.entryFile.base
                                    ),
                                    path.relative(
                                        path.join(configPaths.configBase, path.dirname(targetPath)),
                                        '/src/nest/entryFile.js'
                                    )
                                )

                            ]

                        })
                    );

                });

                it('should append "\n//# sourceMappingURL=" to bundleFile.contents', function () {

                    // given
                    var bundler = new Bundler(),

                        builderResults = {
                            sourceMap: '{"sources": []}',
                            source: ""
                        },
                        configPaths = {
                            configBase: '/jspm/root',
                            jspmRoot: '/jspm/root'
                        },

                        targetPath = this.bundleName,
                        result;

                    // when
                    result = bundler._processSourceMap(this.entryFile, targetPath)(builderResults, configPaths);

                    // then
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result.length).toBe(2);

                    expect(result[0].path).toMatch(new RegExp(this.bundleFile.basename + "$"));
                    expect(result[0].contents.toString()).toMatch(new RegExp("//# sourceMappingURL=" + this.sourceMapFile.basename + "$"));

                });

                it('should return both bundleFile and sourceMapFile', function () {

                    // given
                    var bundler = new Bundler(),

                        builderResults = {
                            sourceMap: '{"sources": []}',
                            source: ""
                        },
                        configPaths = {
                            configBase: '/jspm/root',
                            jspmRoot: '/jspm/root'
                        },

                        targetPath = this.bundleName,
                        result;

                    // when
                    result = bundler._processSourceMap(this.entryFile, targetPath)(builderResults, configPaths);

                    // then
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result.length).toBe(2);

                    expect(result[0].path).toMatch(new RegExp(this.bundleFile.basename + "$"));
                    expect(result[1].path).toMatch(new RegExp(this.sourceMapFile.basename + "$"));

                });

            });

        });

    });

    describe('.bundle(entryFile, targetPath, builderConfig, sfx)', function () {

        it('should return a Promise, resolved with bundleFiles', function (done) {

            // given
            var bundler = new Bundler(),

                configPaths = {
                    jspmRoot: '/jspm/root'
                },
                builderResults = {
                    results: true
                },
                bundleFiles = [
                    this.bundleFile,
                    this.sourceMapFile
                ],

                targetPath = this.bundleName,
                result;

            spyOn(bundler, '_configureJspm').and.returnValue(Promise.resolve(configPaths));

            spyOn(bundler, '_createBundle').and.returnValue(function () {
                return [Promise.resolve(builderResults), Promise.resolve(configPaths)]
            });

            spyOn(bundler, '_processSourceMap').and.returnValue(function () {
                return Promise.resolve(bundleFiles)
            });

            // when
            result = bundler.bundle(this.entryFile, targetPath);

            // then
            result.then(function (_bundleFiles) {
                expect(_bundleFiles).toBe(bundleFiles);
                done();
            });

        });

        it('should call ._configureJspm with entryFile', function () {

            // given
            var bundler = new Bundler(),

                configPaths = {
                    jspmRoot: '/jspm/root'
                },
                builderResults = {
                    results: true
                },
                bundleFiles = [
                    this.bundleFile,
                    this.sourceMapFile
                ],

                targetPath = this.bundleName;

            spyOn(bundler, '_configureJspm').and.returnValue(Promise.resolve(configPaths));

            spyOn(bundler, '_createBundle').and.returnValue(function () {
                return [Promise.resolve(builderResults), Promise.resolve(configPaths)]
            });

            spyOn(bundler, '_processSourceMap').and.returnValue(function () {
                return Promise.resolve(bundleFiles)
            });

            // when
            bundler.bundle(this.entryFile, targetPath);

            // then
            expect(bundler._configureJspm).toHaveBeenCalledWith(this.entryFile);


        });

        it('should call ._createBundle with entryFile, builderConfig, sfx', function () {

            // given
            var bundler = new Bundler(),

                configPaths = {
                    jspmRoot: '/jspm/root'
                },
                builderResults = {
                    results: true
                },
                bundleFiles = [
                    this.bundleFile,
                    this.sourceMapFile
                ],

                targetPath = this.bundleName,
                builderConfig = {

                },
                sfx = false;

            spyOn(bundler, '_configureJspm').and.returnValue(Promise.resolve(configPaths));

            spyOn(bundler, '_createBundle').and.returnValue(function () {
                return [Promise.resolve(builderResults), Promise.resolve(configPaths)]
            });

            spyOn(bundler, '_processSourceMap').and.returnValue(function () {
                return Promise.resolve(bundleFiles)
            });

            // when
            bundler.bundle(this.entryFile, targetPath, builderConfig, sfx);

            // then
            expect(bundler._createBundle).toHaveBeenCalledWith(this.entryFile, builderConfig, sfx);

        });

        it('should call ._processSourceMap with entryFile, targetPath', function () {

            // given
            var bundler = new Bundler(),

                configPaths = {
                    jspmRoot: '/jspm/root'
                },
                builderResults = {
                    results: true
                },
                bundleFiles = [
                    this.bundleFile,
                    this.sourceMapFile
                ],

                targetPath = this.bundleName;

            spyOn(bundler, '_configureJspm').and.returnValue(Promise.resolve(configPaths));

            spyOn(bundler, '_createBundle').and.returnValue(function () {
                return [Promise.resolve(builderResults), Promise.resolve(configPaths)]
            });

            spyOn(bundler, '_processSourceMap').and.returnValue(function () {
                return Promise.resolve(bundleFiles)
            });

            // when
            bundler.bundle(this.entryFile, targetPath);

            // then
            expect(bundler._processSourceMap).toHaveBeenCalledWith(this.entryFile, targetPath);

        });

    });

});