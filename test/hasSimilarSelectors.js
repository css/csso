var fs = require('fs');
var assert = require('assert');
var csso = require('../lib');
var processSelector = require('../lib/restructure/prepare/processSelector');
var restructureUtils = require('../lib/restructure/utils');

function createHasSimilarSelectorsTest(test) {
    it('[' + test.rule1 + '] vs [' + test.rule2 + ']', function() {
        var rule1 = csso.syntax.parse(test.rule1, {
            context: 'rule'
        });
        var rule2 = csso.syntax.parse(test.rule2, {
            context: 'rule'
        });

        processSelector(rule1);
        processSelector(rule2);

        assert.equal(restructureUtils.hasSimilarSelectors(rule1.selector.children, rule2.selector.children), test.expected);
    });
}

describe('hasSimilarSelectors', function() {
    var tests = fs
        .readFileSync(__dirname + '/fixture/similarSelectors.json', 'utf8')
        .replace(/\/\/.+/g, '');

    JSON.parse(tests).forEach(createHasSimilarSelectorsTest);
});
