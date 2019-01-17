const fs = require('fs');
const path = require('path');
const assert = require('assert');
const csso = require('../lib');
const specificity = require('../lib/restructure/prepare/specificity.js');

function createSpecificityTest(test) {
    it(test.selector, () => {
        const ast = csso.syntax.parse(test.selector, {
            context: 'selector'
        });

        assert.strictEqual(String(specificity(ast)), test.expected);
    });
}

describe('specificity', () => {
    const tests = fs
        .readFileSync(path.join(__dirname, '/fixture/specificity.json'), 'utf8')
        .replace(/\/\/.+/g, '');

    JSON.parse(tests).forEach(createSpecificityTest);
});
