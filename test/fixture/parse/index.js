var fs = require('fs');
var path = require('path');
var JsonLocator = require('../../helpers/JsonLocator.js');
var wrapper = {
    ruleset: function(ast) {
        return {
            type: 'Ruleset',
            selector: {
                type: 'Selector',
                selectors: []
            },
            block: ast
        };
    },
    simpleSelector: function(ast) {
        return {
            type: 'SimpleSelector',
            sequence: [ast]
        };
    },
    stylesheet: function(ast) {
        return {
            type: 'StyleSheet',
            rules: [ast]
        };
    },
    value: function(ast) {
        return {
            type: 'Value',
            important: false,
            sequence: [ast]
        };
    }
};

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var key in file.tests) {
            factory(file.tests[key].name, file.tests[key], file.scope);
        }
    };
}

var testFiles = fs.readdirSync(__dirname).reduce(function(result, scope) {
    var dir = path.join(__dirname, scope);

    if (fs.statSync(dir).isDirectory()) {
        fs.readdirSync(dir).forEach(function(fn) {
            var filename = path.join(dir, fn);
            var tests = require(filename);
            var locator = new JsonLocator(filename);

            for (var key in tests) {
                tests[key].name = locator.get(key);
                if (tests[key].ast.type.toLowerCase() !== scope.toLowerCase() && wrapper.hasOwnProperty(scope)) {
                    tests[key].ast = wrapper[scope](tests[key].ast);
                }
            }

            result[filename] = {
                scope: scope,
                tests: tests
            };
        });
    }

    return result;
}, {});

module.exports = {
    forEachTest: forEachTest,
    tests: testFiles
};
