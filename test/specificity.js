var fs = require('fs');
var assert = require('assert');
var csso = require('../lib/index.js');
var specificity = require('../lib/compressor/restructure/prepare/specificity.js');

function createSpecificityTest(test) {
    it(test.selector, function() {
        var ast = csso.parse(test.selector, 'simpleSelector');

        assert.equal(String(specificity(ast)), test.expected);
    });
}

describe('specificity', function() {
    var tests = fs
        .readFileSync(__dirname + '/fixture/specificity.json', 'utf8')
        .replace(/\/\/.+/g, '');

    JSON.parse(tests).forEach(createSpecificityTest);
});
