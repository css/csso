var assert = require('assert');
var csso = require('../lib');
var specificity = require('../lib/restructure/prepare/specificity.js');
var tests = require(__dirname + '/fixture/specificity.js', 'utf8');

describe('specificity', function() {
    tests.forEach(function(test) {
        (test.only ? it.only : it)(test.selector, function() {
            var ast = csso.syntax.parse(test.selector, {
                context: 'selector'
            });

            assert.deepStrictEqual(specificity(ast), test.expected.split(',').map(Number));
        });
    });
});
