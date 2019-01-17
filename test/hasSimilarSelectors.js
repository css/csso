const fs = require('fs');
const path = require('path');
const assert = require('assert');
const csso = require('../lib');
const processSelector = require('../lib/restructure/prepare/processSelector');
const restructureUtils = require('../lib/restructure/utils');

function createHasSimilarSelectorsTest(test) {
    it(`[${test.rule1}] vs [${test.rule2}]`, () => {
        const rule1 = csso.syntax.parse(test.rule1, {
            context: 'rule'
        });
        const rule2 = csso.syntax.parse(test.rule2, {
            context: 'rule'
        });

        processSelector(rule1);
        processSelector(rule2);

        assert.strictEqual(restructureUtils.hasSimilarSelectors(rule1.prelude.children, rule2.prelude.children), test.expected);
    });
}

describe('hasSimilarSelectors', () => {
    const tests = fs
        .readFileSync(path.join(__dirname, '/fixture/similarSelectors.json'), 'utf8')
        .replace(/\/\/.+/g, '');

    JSON.parse(tests).forEach(createHasSimilarSelectorsTest);
});
