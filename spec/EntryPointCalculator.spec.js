var File = require('vinyl'),
    EntryPointCalculator = require('../lib/EntryPointCalculator');

describe('EntryPointCalculator', function () {

    describe('.calc(entryFile, jspmRoot)', function () {

        beforeEach(function () {

            this.entryFile = new File({
                base: '/src',
                path: '/src/main.js'
            });

        });

        it('result should be relative from jspmRoot', function () {

            // given
            var entryPointCalculator = new EntryPointCalculator(),

                jspmRoot = '/jspm/root',

                result;

            // when
            result = entryPointCalculator.calc(this.entryFile, jspmRoot);

            // then
            expect(result).toBe('../../src/main.js');

        });

        it('if entryFile has jspm.plugin, append result with plugin syntax', function () {

            // given
            var entryPointCalculator = new EntryPointCalculator(),

                jspmRoot = '/src',

                result;

            this.entryFile.jspm = {
                plugin: 'plugin'
            };

            // when
            result = entryPointCalculator.calc(this.entryFile, jspmRoot);

            // then
            expect(result).toBe('main.js!plugin');

        });

        it('if entryFile has jspm.arithmetic, append result with arithmetic syntax', function () {

            // given
            var entryPointCalculator = new EntryPointCalculator(),

                jspmRoot = '/src',

                result;

            this.entryFile.jspm = {
                arithmetic: '- bundle'
            };

            // when
            result = entryPointCalculator.calc(this.entryFile, jspmRoot);

            // then
            expect(result).toBe('main.js - bundle');

        });

    })

});