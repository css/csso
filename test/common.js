var fs = require('fs');
var assert = require('assert');
var csso = require('../lib/index.js');

describe('csso', function() {
    it('justDoIt() should works until removed', function() {
        var output = [];
        var tmp = console.warn;

        try {
            console.warn = function() {
                output.push(Array.prototype.slice.call(arguments).join(' '));
            };

            assert.equal(
                csso.justDoIt('.foo { color: #ff0000 } .bar { color: rgb(255, 0, 0) }'),
                '.bar,.foo{color:red}'
            );
        } finally {
            console.warn = tmp;
        }

        assert.equal(output.length, 1);
        assert(/method is deprecated/.test(String(output[0])), 'should contains `method is deprecated`');
    });

    it('walk', function() {
        function visit(withInfo) {
            var visitedTypes = {};

            csso.walk(csso.parse('@media (min-width: 200px) { .foo:nth-child(2n) { color: rgb(100%, 10%, 0%); width: calc(3px + 5%) } }', 'stylesheet', withInfo), function(node) {
                visitedTypes[node[withInfo ? 1 : 0]] = true;
            }, withInfo);

            return Object.keys(visitedTypes).sort();
        }

        var shouldVisitTypes = ['stylesheet', 'atruler', 'atkeyword', 'ident', 'atrulerq', 's', 'braces', 'operator', 'dimension', 'number', 'atrulers', 'ruleset', 'selector', 'simpleselector', 'clazz', 'nthselector', 'nth', 'block', 'declaration', 'property', 'value', 'funktion', 'functionBody', 'percentage', 'decldelim', 'unary'].sort();

        assert.deepEqual(visit(), shouldVisitTypes, 'w/o info');
        assert.deepEqual(visit(true), shouldVisitTypes, 'with info');
    });

    it('strigify', function() {
        assert.equal(
            csso.stringify(csso.parse('.a\n{\rcolor:\r\nred}', 'stylesheet', true)),
            fs.readFileSync(__dirname + '/fixture/stringify.txt', 'utf-8').trim()
        );
    });
});
