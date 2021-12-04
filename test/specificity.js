import { deepStrictEqual } from 'assert';
import { syntax } from 'csso';
import specificity from '../lib/restructure/prepare/specificity.js';
import tests from './fixture/specificity.js';

describe('specificity', () => {
    tests.forEach((test) => {
        (test.only ? it.only : it)(test.selector, () => {
            const ast = syntax.parse(test.selector, {
                context: 'selector'
            });

            deepStrictEqual(specificity(ast), test.expected.split(',').map(Number));
        });
    });
});
