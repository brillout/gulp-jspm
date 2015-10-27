var StreamValidator = require('../lib/StreamValidator');

describe('StreamValidator', function () {

    describe('.withObjectStream(objectStreamFn)', function () {

        it('should return a through2.obj', function () {

            // given
            var through2 = jasmine.createSpyObj('through2', ['obj']),
                streamValidator = new StreamValidator(through2),

                result;

            through2.obj.and.returnValue('through2');

            // when
            result = streamValidator.withObjectStream();

            // then
            expect(result).toBe('through2');
            expect(through2.obj).toHaveBeenCalled();

        });

        describe('through2.obj', function () {

            it('if file is null, emit error', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull']),
                    streamValidator = new StreamValidator(through2),

                    filter,

                    result,

                    emittedType,
                    emittedError;

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(true);

                streamValidator.withObjectStream();

                // when
                result = filter.apply({
                    emit: function (type, error) {
                        emittedType = type;
                        emittedError = error;
                    }
                },
                [
                    file,
                    'utf8',
                    function () {
                        return 'done';
                    }
                ]);

                // then

                expect(emittedType).toBe('error');
                expect(emittedError.message).toBe('File contents must be read to proceed. Are you using {read: false}?');
                expect(result).toBe('done');

            });

            it('if file is stream, emit error', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull', 'isStream']),
                    streamValidator = new StreamValidator(through2),

                    filter,

                    result,

                    emittedType,
                    emittedError;

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(false);
                file.isStream.and.returnValue(true);

                streamValidator.withObjectStream();

                // when
                result = filter.apply({
                    emit: function (type, error) {
                        emittedType = type;
                        emittedError = error;
                    }
                },
                [
                    file,
                    'utf8',
                    function () {
                        return 'done';
                    }
                ]);

                // then

                expect(emittedType).toBe('error');
                expect(emittedError.message).toBe('Streams are not supported.');
                expect(result).toBe('done');

            });

            it('if file is buffer, add file.jspm = {}', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull', 'isStream', 'isBuffer']),
                    streamValidator = new StreamValidator(through2),

                    filter,

                    objectStreamFn = jasmine.createSpy('objectStreamFn');

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(false);
                file.isStream.and.returnValue(false);
                file.isBuffer.and.returnValue(true);

                streamValidator.withObjectStream(objectStreamFn);

                // when
                filter(file, 'utf8', function () {});

                // then
                expect(file.jspm).toBeDefined();
                expect(file.jspm).toEqual({});

            });

            it('if file is buffer, dont overwrite existing file.jspm', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull', 'isStream', 'isBuffer']),
                    streamValidator = new StreamValidator(through2),

                    filter,

                    objectStreamFn = jasmine.createSpy('objectStreamFn');

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(false);
                file.isStream.and.returnValue(false);
                file.isBuffer.and.returnValue(true);

                file.jspm = {
                    jspm: true
                };

                streamValidator.withObjectStream(objectStreamFn);

                // when
                filter(file, 'utf8', function () {});

                // then
                expect(file.jspm).toBeDefined();
                expect(file.jspm).toEqual({
                    jspm: true
                });

            });

            it('if file is buffer, execute objectStreamFn', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull', 'isStream', 'isBuffer']),
                    streamValidator = new StreamValidator(through2),

                    filter,

                    objectStreamFn = jasmine.createSpy('objectStreamFn');

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(false);
                file.isStream.and.returnValue(false);
                file.isBuffer.and.returnValue(true);

                streamValidator.withObjectStream(objectStreamFn);

                // when
                filter(file, 'utf8', function () {});

                // then
                expect(objectStreamFn).toHaveBeenCalledWith(file, 'utf8', jasmine.any(Function));

            });

            it('if file is buffer, objectStreamFn is called with pushFn(bundleFiles) where bundleFiles is Array', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull', 'isStream', 'isBuffer']),
                    streamValidator = new StreamValidator(through2),

                    filter,
                    pushed = [],
                    pushFn,

                    objectStreamFn = jasmine.createSpy('objectStreamFn');

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(false);
                file.isStream.and.returnValue(false);
                file.isBuffer.and.returnValue(true);

                objectStreamFn.and.callFake(function (_file, _enc, _pushFn) {
                    pushFn = _pushFn;
                });

                streamValidator.withObjectStream(objectStreamFn);

                filter.apply({
                    push: function (files) {
                        pushed.push(files);
                    }
                },
                [
                    file,
                    'utf8',
                    function () {
                        return 'done';
                    }
                ]);

                // when
                pushFn([file]);

                // then
                expect(pushed.length).toBe(1);
                expect(pushed[0]).toBe(file);

            });

            it('if file is buffer, objectStreamFn is called with pushFn(bundleFiles) where bundleFiles is NOT Array', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull', 'isStream', 'isBuffer']),
                    streamValidator = new StreamValidator(through2),

                    filter,
                    pushed = [],
                    pushFn,

                    objectStreamFn = jasmine.createSpy('objectStreamFn');

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(false);
                file.isStream.and.returnValue(false);
                file.isBuffer.and.returnValue(true);

                objectStreamFn.and.callFake(function (_file, _enc, _pushFn) {
                    pushFn = _pushFn;
                });

                streamValidator.withObjectStream(objectStreamFn);

                filter.apply({
                    push: function (files) {
                        pushed.push(files);
                    }
                },
                [
                    file,
                    'utf8',
                    function () {
                        return 'done';
                    }
                ]);

                // when
                pushFn(file);

                // then
                expect(pushed.length).toBe(1);
                expect(pushed[0]).toBe(file);
            })

            it('if file is NOT null AND NOT stream AND NOT buffer, emit error', function () {

                // given
                var through2 = jasmine.createSpyObj('through2', ['obj']),
                    file = jasmine.createSpyObj('file', ['isNull', 'isStream', 'isBuffer']),
                    streamValidator = new StreamValidator(through2),

                    filter,

                    result,

                    emittedType,
                    emittedError;

                through2.obj.and.callFake(function (_filter) {
                    filter = _filter;
                });

                file.isNull.and.returnValue(false);
                file.isStream.and.returnValue(false);
                file.isBuffer.and.returnValue(false);

                streamValidator.withObjectStream();

                // when
                result = filter.apply({
                    emit: function (type, error) {
                        emittedType = type;
                        emittedError = error;
                    }
                },
                [
                    file,
                    'utf8',
                    function () {
                        return 'done';
                    }
                ]);

                // then

                expect(emittedType).toBe('error');
                expect(emittedError.message).toBe('File contents must be read as buffer to proceed.');
                expect(result).toBe('done');

            });

        });

    });

});