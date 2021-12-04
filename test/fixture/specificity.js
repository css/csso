export default [
    // source: https://github.com/keeganstreet/specificity/blob/master/test/test.js

    // http://css-tricks.com/specifics-on-css-specificity/
    { selector: 'ul#nav li.active a', expected: '1,1,3' },
    { selector: 'body.ie7 .col_3 h2 ~ h2', expected: '0,2,3' },
    { selector: '#footer *:not(nav) li', expected: '1,0,2' },
    { selector: 'ul > li ul li ol li:first-letter', expected: '0,0,7' },

    // http://reference.sitepoint.com/css/specificity
    { selector: 'body#home div#warning p.message', expected: '2,1,3' },
    { selector: '* body#home>div#warning p.message', expected: '2,1,3' },
    { selector: '#home #warning p.message', expected: '2,1,1' },
    { selector: '#warning p.message', expected: '1,1,1' },
    { selector: '#warning p', expected: '1,0,1' },
    { selector: 'p.message', expected: '0,1,1' },
    { selector: 'p', expected: '0,0,1' },

    // Test pseudo-element with uppercase letters
    { selector: 'li:bEfoRE', expected: '0,0,2' },

    // Pseudo-class tests
    { selector: 'li:first-child+p', expected: '0,1,2'},
    { selector: 'li:nth-child(even)+p', expected: '0,1,2'},
    { selector: 'li:nth-child(2n+1)+p', expected: '0,1,2'},
    { selector: 'li:nth-child( 2n + 1 )+p', expected: '0,1,2'},
    { selector: 'li:nth-child(2n-1)+p', expected: '0,1,2'},
    { selector: 'li:nth-child(2n-1) p', expected: '0,1,2'},
    { selector: ':lang(nl-be)', expected: '0,1,0'},

    // source: https://github.com/CSSLint/parser-lib/blob/master/tests/css/CSSSpecificityTests.htm
    { selector: 'body #foo .foo p', expected: '1,1,2' },
    { selector: '.f00', expected: '0,1,0' },
    { selector: 'div p.foo', expected: '0,1,2' },
    { selector: 'li:first-line', expected: '0,0,2' },

    // https://www.w3.org/TR/selectors-4/#specificity-rules
    { selector: '*', expected: '0,0,0' },
    { selector: 'li', expected: '0,0,1' },
    { selector: 'ul li', expected: '0,0,2' },
    { selector: 'ul ol+li', expected: '0,0,3' },
    { selector: 'h1 + *[rel=up]', expected: '0,1,1' },
    { selector: 'ul ol li.red', expected: '0,1,3' },
    { selector: 'li.red.level', expected: '0,2,1' },
    { selector: '#x34y', expected: '1,0,0' },
    { selector: '#s12:not(FOO)', expected: '1,0,1' },
    { selector: '.foo :is(.bar, #baz)', expected: '1,1,0' },
    { selector: ':is(em, #foo)', expected: '1,0,0' },
    { selector: '.qux:where(em, #foo#bar#baz)', expected: '0,1,0' },
    { selector: ':nth-child(even of li, .item)', expected: '0,2,0' },
    { selector: ':not(em, strong#foo)', expected: '1,0,1' },

    // OWN TESTS
    { selector: 'ns|*:hover', expected: '0,1,0' },
    { selector: '*|*:hover', expected: '0,1,0' },
    { selector: '|*:hover', expected: '0,1,0' },
    { selector: 'ns|tag:hover', expected: '0,1,1' },
    { selector: '*|tag:hover', expected: '0,1,1' },

    { selector: '::selection', expected: '0,0,1' },
    { selector: '::before::after::next', expected: '0,0,3' },
    { selector: ':before:after:next', expected: '0,1,2' },
    { selector: 'div:first-child:first-line', expected: '0,1,2' },

    { selector: ':nth-child(2n of h1, h2, h3)', expected: '0,1,1' },
    { selector: ':nth-child(2n of h1, h2 a, h3 a b)', expected: '0,1,3' },
    { selector: ':nth-child(2n of h1 a b, h2 a, h3)', expected: '0,1,3' },

    { selector: ':where(h1, h2 img, h3 + .foo.bar)', expected: '0,0,0' },
    { selector: ':where(h1, h2 img, h3 + :not(.foo.bar))', expected: '0,0,0' },
    { selector: 'a:hover:where(h1, h2 img, h3 + .foo.bar)', expected: '0,1,1' },

    { selector: ':is(h1, h2 img, h3 + .foo.bar)', expected: '0,2,1' },
    { selector: ':matches(h1, h2 img, h3 + .foo.bar)', expected: '0,2,1' },
    { selector: ':-moz-any(h1, h2 img, h3 + .foo.bar)', expected: '0,2,1' },
    { selector: ':-webkit-any(h1, h2 img, h3 + .foo.bar)', expected: '0,2,1' },
    { selector: 'a:hover:is(h1, h2 img, h3 + .foo.bar)', expected: '0,3,2' },
    { selector: 'a:hover:matches(h1, h2 img, h3 + .foo.bar)', expected: '0,3,2' },
    { selector: 'a:hover:-moz-any(h1, h2 img, h3 + .foo.bar)', expected: '0,3,2' },
    { selector: 'a:hover:-webkit-any(h1, h2 img, h3 + .foo.bar)', expected: '0,3,2' },

    { selector: ':not(h1, h2 img, h3 + .foo.bar)', expected: '0,2,1' },
    { selector: 'a:hover:not(h1, h2 img, h3 + .foo.bar)', expected: '0,3,2' },

    { selector: ':has(h1, h2 img, h3 + .foo.bar)', expected: '0,2,1' },
    { selector: 'a:hover:has(h1, h2 img, h3 + .foo.bar)', expected: '0,3,2' }
];
