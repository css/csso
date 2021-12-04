import { deepStrictEqual } from 'assert';
import { syntax } from 'csso';
import tests from './fixture/specificity.js';

describe('specificity', () => {
    tests.forEach((test) => {
        (test.only ? it.only : it)(test.selector, () => {
            const ast = syntax.parse(test.selector, {
                context: 'selector'
            });

            deepStrictEqual(syntax.specificity(ast), test.expected.split(',').map(Number));
        });
    });
});
