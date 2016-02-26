var fs = require('fs');
var path = require('path');
var JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var key in file.tests) {
            factory(file.tests[key].name, file.tests[key], file.scope);
        }
    };
}

var testFiles = fs.readdirSync(__dirname).reduce(function(result, rule) {
    var filename = path.join(__dirname, rule);
    var tests = require(filename);
    var locator = new JsonLocator(filename);

    for (var key in tests) {
        tests[key].name = locator.get(key);
    }

    result[filename] = {
        scope: path.basename(rule, path.extname(rule)),
        tests: tests
    };

    return result;
}, {});

module.exports = {
    forEachTest: forEachTest,
    tests: testFiles
};
