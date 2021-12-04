import { readFileSync } from 'fs';
import { equal } from 'assert';
import { syntax, utils } from 'csso';

function createHasSimilarSelectorsTest(test) {
    it('[' + test.rule1 + '] vs [' + test.rule2 + ']', () => {
        const rule1 = syntax.parse(test.rule1, {
            context: 'rule'
        });
        const rule2 = syntax.parse(test.rule2, {
            context: 'rule'
        });

        utils.processSelector(rule1);
        utils.processSelector(rule2);

        equal(
            utils.hasSimilarSelectors(rule1.prelude.children, rule2.prelude.children),
            test.expected
        );
    });
}

describe('hasSimilarSelectors', () => {
    const tests = readFileSync('./fixtures/similarSelectors.json', 'utf8')
        .replace(/\/\/.+/g, '');

    JSON.parse(tests).forEach(createHasSimilarSelectorsTest);
});
