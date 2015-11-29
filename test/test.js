var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csso = require('../lib/index.js');
var wrapAst = require('../lib/compressor/ast/index.js');
var specificity = require('../lib/compressor/prepare/specificity.js');

function createParseTest(name, test, scope) {
    return it(name, function() {
        var ast = csso.parse(test.source, scope);

        // AST should be equal
        assert.equal(csso.stringify(ast), csso.stringify(test.ast));

        // translated AST should be equal to original source
        assert.equal(csso.translate(ast), test.source);
    });
}

function createSpecificityTest(test) {
    return it(test.selector, function() {
        var ast = wrapAst(csso.parse(test.selector, 'simpleselector', true));

        assert.equal(String(specificity(ast)), test.expected);
    });
}

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

function createCompressTest(name, test) {
    return it(name, function() {
        var compressed = csso.minify(test.source);

        assert.equal(normalize(compressed), normalize(test.compressed));
    });
}

describe('csso', function() {
    describe('parse', function() {
        var testDir = path.join(__dirname, 'fixture/parse');
        fs.readdirSync(testDir).forEach(function(rule) {
            var tests = require(path.join(testDir, rule));
            var scope = path.basename(rule, path.extname(rule));

            for (var name in tests) {
                createParseTest(name, tests[name], scope);
            }
        });
    });

    describe('specificity', function() {
        var tests = fs
            .readFileSync(__dirname + '/fixture/specificity.json', 'utf8')
            .replace(/\/\/.+/g, '');

        JSON.parse(tests).forEach(createSpecificityTest);
    });

    describe('compress', function() {
        function scan(dir) {
            var tests = fs.readdirSync(dir).reduce(function(list, filename) {
                var fullpath = path.join(dir, filename);

                // nested dir
                if (fs.statSync(fullpath).isDirectory()) {
                    scan(fullpath);
                    return list;
                }

                var name = filename.replace(/(\.min)?\.css$/, '');
                var key = /\.min\.css/.test(filename) ? 'compressed' : 'source';

                // in case there is a filename that doesn't ends with `.css` or `.min.css`
                if (name !== filename) {
                    if (!list[name]) {
                        list[name] = {};
                    }

                    list[name][key] = fs.readFileSync(fullpath, 'utf8').trim();
                }

                return list;
            }, {});

            for (var name in tests) {
                createCompressTest(path.join(path.relative(__dirname + '/..', dir), name + '.css'), tests[name]);
            }
        }

        scan(path.join(__dirname, 'fixture/compress'));
    });
});
