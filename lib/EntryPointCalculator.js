var path = require('path');

function EntryPointCalculator() {}

/**
 * Calculate the entryPoint string to include a specified plugin or bundle arithmetic as necessary
 *
 * @param entryFile {Vinyl}
 * @param jspmRoot {String} jspm root directory
 */
EntryPointCalculator.prototype.calc = function (entryFile, jspmRoot) {

    var result = path.relative(jspmRoot, entryFile.path);

    if (entryFile.jspm && entryFile.jspm.plugin) {
        result += '!' + entryFile.jspm.plugin;
    }

    if (entryFile.jspm && entryFile.jspm.arithmetic) {
        result += ' ' + entryFile.jspm.arithmetic.trim();
    }

    return result;

};

module.exports = EntryPointCalculator;