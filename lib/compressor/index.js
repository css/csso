var List = require('../utils/list.js');
var convertToInternal = require('./ast/gonzalesToInternal.js');
var convertToGonzales = require('./ast/internalToGonzales.js');
var internalTranslate = require('./ast/translate.js');
var internalWalkAll = require('./ast/walk.js').all;
var cleanFn = require('./clean');
var compressFn = require('./compress');
var restructureAst = require('./restructure');

function createLogger(level) {
    var lastDebug;

    if (!level) {
        // no output
        return function() {};
    }

    return function debugOutput(name, token, reset) {
        var line = (!reset ? '(' + ((Date.now() - lastDebug) / 1000).toFixed(3) + 'ms) ' : '') + name;

        if (level > 1 && token) {
            var css = internalTranslate(token, true).trim();

            // when level 2, limit css to 256 symbols
            if (level === 2 && css.length > 256) {
                css = css.substr(0, 256) + '...';
            }

            line += '\n  ' + css + '\n';
        }

        console.error(line);
        lastDebug = Date.now();
    };
};

function injectInfo(token) {
    for (var i = token.length - 1; i > -1; i--) {
        var child = token[i];

        if (Array.isArray(child)) {
            injectInfo(child);
            child.unshift({});
        }
    }
}

function readBlock(stylesheet, offset) {
    var buffer = [];
    var nonSpaceTokenInBuffer = false;
    var protectedComment;

    for (var i = offset; i < stylesheet.length; i++) {
        var token = stylesheet[i];

        if (token[1] === 'comment' &&
            token[2].charAt(0) === '!') {
            if (nonSpaceTokenInBuffer || protectedComment) {
                break;
            }

            protectedComment = token;
            continue;
        }

        if (token[1] !== 's') {
            nonSpaceTokenInBuffer = true;
        }

        buffer.push(token);
    }

    return {
        comment: protectedComment,
        stylesheet: [{}, 'stylesheet'].concat(buffer),
        offset: i
    };
}

function compressBlock(ast, restructuring, num, debug) {
    debug('Compress block #' + num, null, true);

    var internalAst = convertToInternal(ast);
    debug('convertToInternal', internalAst);

    internalAst.firstAtrulesAllowed = ast.firstAtrulesAllowed;

    // remove useless
    internalWalkAll(internalAst, cleanFn);
    debug('clean', internalAst);

    // compress nodes
    internalWalkAll(internalAst, compressFn);
    debug('compress', internalAst);

    // structure optimisations
    if (restructuring) {
        restructureAst(internalAst, debug);
    }

    return internalAst;
}

module.exports = function compress(ast, options) {
    ast = ast || [{}, 'stylesheet'];
    options = options || {};

    var debug = createLogger(options.debug);
    var restructuring =
        'restructure' in options ? options.restructure :
        'restructuring' in options ? options.restructuring :
        true;
    var result = new List();
    var block = { offset: 2 };
    var firstAtrulesAllowed = true;
    var blockNum = 1;

    if (typeof ast[0] === 'string') {
        injectInfo([ast]);
    }

    do {
        block = readBlock(ast, block.offset);
        block.stylesheet.firstAtrulesAllowed = firstAtrulesAllowed;
        block.stylesheet = compressBlock(block.stylesheet, restructuring, blockNum++, debug);

        if (block.comment) {
            // add \n before comment if there is another content in result
            if (!result.isEmpty()) {
                result.insert(List.createItem({
                    type: 'Raw',
                    value: '\n'
                }));
            }

            result.insert(List.createItem({
                type: 'Comment',
                value: block.comment[2]
            }));

            // add \n after comment if block is not empty
            if (!block.stylesheet.rules.isEmpty()) {
                result.insert(List.createItem({
                    type: 'Raw',
                    value: '\n'
                }));
            }
        }

        result.appendList(block.stylesheet.rules);

        if (firstAtrulesAllowed && !result.isEmpty()) {
            var lastRule = result.last();

            if (lastRule.type !== 'Atrule' ||
               (lastRule.name !== 'import' && lastRule.name !== 'charset')) {
                firstAtrulesAllowed = false;
            }
        }
    } while (block.offset < ast.length);

    if (!options.outputAst || options.outputAst === 'gonzales') {
        return convertToGonzales({
            type: 'StyleSheet',
            rules: result
        });
    }

    return {
        type: 'StyleSheet',
        rules: result
    };
};
