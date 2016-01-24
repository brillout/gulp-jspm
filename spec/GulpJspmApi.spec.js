var GulpJspmApi = require('../lib/GulpJspmApi');

describe('GulpJspmApi', function () {

    describe('.plugin(name)', function () {

        it('should return streamValidator.withObjectStream', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                result;

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // when
            result = gulpJspmApi.plugin('plugin');

            // then
            expect(result).toBe('withObjectStream');

        });

        it('should set jspm.plugin on withObjectStream file', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                withObjectStream,
                file = {
                    jspm: {}
                },

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.plugin('plugin');

            // when
            withObjectStream(file, 'utf8', function () {});

            // then
            expect(file.jspm.plugin).toBe('plugin');

        });

        it('withObjectStream should push file back onto queue', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                withObjectStream,
                file = {
                    jspm: {}
                },

                pushFn = jasmine.createSpy('pushFn'),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.plugin('plugin');

            // when
            withObjectStream(file, 'utf8', pushFn);

            // then
            expect(pushFn).toHaveBeenCalledWith(file);

        });

    });

    describe('.arithmetic(expression)', function () {

        it('should return streamValidator.withObjectStream', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                result;

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // when
            result = gulpJspmApi.arithmetic('- message');

            // then
            expect(result).toBe('withObjectStream');

        });

        it('should set jspm.arithmetic on withObjectStream file', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                withObjectStream,
                file = {
                    jspm: {}
                },

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.arithmetic('- message');

            // when
            withObjectStream(file, 'utf8', function () {});

            // then
            expect(file.jspm.arithmetic).toBe('- message');

        });

        it('withObjectStream should push file back onto queue', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                withObjectStream,
                file = {
                    jspm: {}
                },

                pushFn = jasmine.createSpy('pushFn'),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.arithmetic('- message');

            // when
            withObjectStream(file, 'utf8', pushFn);

            // then
            expect(pushFn).toHaveBeenCalledWith(file);

        });

    });

    describe('.buildStatic(entryPath, targetPath, builderConfig)', function () {

        it('should return streamValidator.withObjectStream', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                result;

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // when
            result = gulpJspmApi.buildStatic('/src/main.js', 'main.bundle.js');

            // then
            expect(result).toBe('withObjectStream');

        });

        it('should throw error if entryPath == undefined', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // expect
            expect(gulpJspmApi.buildStatic).toThrowError('entryPath param is required.');

        });

        it('should throw error if targetPath == undefined', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // expect
            expect(function () {
                gulpJspmApi.buildStatic('/src/main.js')
            }).toThrowError('targetPath param is required.');

        });

        it('withObjectStream flushFn should call bundler.bundle(entryPath, targetPath, builderConfig, streamCache, true)', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                flushFn,

                entryPath = '/src/main.js',
                targetPath = 'main.bundle.js',
                builderConfig = {
                    config: true
                };

            bundler.bundle.and.returnValue({
                then: function () {}
            });

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream, _flushFn) {
                flushFn = _flushFn;
            });

            gulpJspmApi.buildStatic(entryPath, targetPath, builderConfig);

            // when
            flushFn();

            // then
            expect(bundler.bundle).toHaveBeenCalledWith(entryPath, targetPath, builderConfig, jasmine.any(Array), true);

        });

        it('withObjectStream flushFn should push file(s) back onto queue', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                flushFn,

                entryPath = '/src/main.js',
                targetPath = 'main.bundle.js',
                builderConfig = {
                    config: true
                },

                bundleFiles = 'bundleFiles',
                pushFn = jasmine.createSpy('pushFn');

            bundler.bundle.and.returnValue({
                then: function (fn) {
                    fn(bundleFiles);
                }
            });

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream, _flushFn) {
                flushFn = _flushFn;
            });

            gulpJspmApi.buildStatic(entryPath, targetPath, builderConfig);

            // when
            flushFn.apply({ push: pushFn }, [function () {}]);

            // then
            expect(pushFn).toHaveBeenCalledWith(bundleFiles);

        });

    });

    describe('.bundle(entryPath, targetPath, builderConfig)', function () {

        it('should return streamValidator.withObjectStream', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                result;

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // when
            result = gulpJspmApi.bundle('/src/main.js', 'main.bundle.js');

            // then
            expect(result).toBe('withObjectStream');

        });

        it('should throw error if entryPath == undefined', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // expect
            expect(gulpJspmApi.bundle).toThrowError('entryPath param is required.');

        });

        it('should throw error if targetPath == undefined', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // expect
            expect(function () {
                gulpJspmApi.bundle('/src/main.js')
            }).toThrowError('targetPath param is required.');

        });

        it('withObjectStream flushFn should call bundler.bundle(entryFile, targetPath, builderConfig, streamCache)', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                flushFn,

                entryPath = '/src/main.js',
                targetPath = 'main.bundle.js',
                builderConfig = {
                    config: true
                };

            bundler.bundle.and.returnValue({
                then: function () {}
            });

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream, _flushFn) {
                flushFn = _flushFn;
            });

            gulpJspmApi.bundle(entryPath, targetPath, builderConfig);

            // when
            flushFn();

            // then
            expect(bundler.bundle).toHaveBeenCalledWith(entryPath, targetPath, builderConfig, jasmine.any(Array));

        });

        it('withObjectStream flushFn should push file(s) back onto queue', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                flushFn,

                entryPath = '/src/main.js',
                targetPath = 'main.bundle.js',
                builderConfig = {
                    config: true
                },

                bundleFiles = 'bundleFiles',
                pushFn = jasmine.createSpy('pushFn');

            bundler.bundle.and.returnValue({
                then: function (fn) {
                    fn(bundleFiles);
                }
            });

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream, _flushFn) {
                flushFn = _flushFn
            });

            gulpJspmApi.bundle(entryPath, targetPath, builderConfig);

            // when
            flushFn.apply({ push: pushFn }, [function () {}]);

            // then
            expect(pushFn).toHaveBeenCalledWith(bundleFiles);

        });

    });

    describe('.logError(error)', function () {

        it('should write to stderr', function () {

            // given
            var gulpJspmApi = new GulpJspmApi(),
                error;

            process.stderr = spyOn(process.stderr, 'write').and.callFake(function (_error) {
                error = _error;
            });

            // when
            gulpJspmApi.logError(new Error("message"));

            // then
            expect(error).toBe("Error: message\n")

        });

    });

});