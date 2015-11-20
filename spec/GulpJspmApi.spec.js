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

    describe('.buildStatic(targetPath, builderConfig)', function () {

        it('should return streamValidator.withObjectStream', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                result;

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // when
            result = gulpJspmApi.buildStatic('main.bundle.js');

            // then
            expect(result).toBe('withObjectStream');

        });

        it('should throw error if targetPath == undefined', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // expect
            expect(gulpJspmApi.buildStatic).toThrowError('targetPath param is required.');

        });

        it('withObjectStream should call bundler.bundle(entryFile, targetPath, builderConfig, true)', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                withObjectStream,

                entryFile = {
                    jspm: {}
                },
                targetPath = 'main.bundle.js',
                builderConfig = {
                    config: true
                };

            bundler.bundle.and.returnValue({
                then: function () {}
            });

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.buildStatic(targetPath, builderConfig);

            // when
            withObjectStream(entryFile, 'utf8', function () {});

            // then
            expect(bundler.bundle).toHaveBeenCalledWith(entryFile, targetPath, builderConfig, true);

        });

        it('withObjectStream should push file(s) back onto queue', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                withObjectStream,

                entryFile = {
                    jspm: {}
                },
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

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.buildStatic(targetPath, builderConfig);

            // when
            withObjectStream(entryFile, 'utf8', pushFn);

            // then
            expect(pushFn).toHaveBeenCalledWith(bundleFiles);

        });

    });

    describe('.bundle(targetPath, builderConfig)', function () {

        it('should return streamValidator.withObjectStream', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                result;

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // when
            result = gulpJspmApi.bundle('main.bundle.js');

            // then
            expect(result).toBe('withObjectStream');

        });

        it('should throw error if targetPath == undefined', function () {

            // given
            var bundler = jasmine.createSpy('bundler'),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator);

            streamValidator.withObjectStream.and.returnValue('withObjectStream');

            // expect
            expect(gulpJspmApi.bundle).toThrowError('targetPath param is required.');

        });

        it('withObjectStream should call bundler.bundle(entryFile, targetPath, builderConfig)', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                withObjectStream,

                entryFile = {
                    jspm: {}
                },
                targetPath = 'main.bundle.js',
                builderConfig = {
                    config: true
                };

            bundler.bundle.and.returnValue({
                then: function () {}
            });

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.bundle(targetPath, builderConfig);

            // when
            withObjectStream(entryFile, 'utf8', function () {});

            // then
            expect(bundler.bundle).toHaveBeenCalledWith(entryFile, targetPath, builderConfig);

        });

        it('withObjectStream should push file(s) back onto queue', function () {

            // given
            var bundler = jasmine.createSpyObj('bundler', ['bundle']),
                streamValidator = jasmine.createSpyObj('streamValidator', ['withObjectStream']),

                gulpJspmApi = new GulpJspmApi(bundler, streamValidator),

                withObjectStream,

                entryFile = {
                    jspm: {}
                },
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

            streamValidator.withObjectStream.and.callFake(function (_withObjectStream) {
                withObjectStream = _withObjectStream;
            });

            gulpJspmApi.bundle(targetPath, builderConfig);

            // when
            withObjectStream(entryFile, 'utf8', pushFn);

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