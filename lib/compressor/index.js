var List = require('../utils/list.js');
var convertToInternal = require('./ast/gonzalesToInternal.js');
var convertToGonzales = require('./ast/internalToGonzales.js');
var internalWalkAll = require('./ast/walk.js').all;
var clean = require('./clean');
var compress = require('./compress');
var restructureAst = require('./restructure');

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

function compressBlock(ast, restructuring, num, logger) {
    logger('Compress block #' + num, null, true);

    var internalAst = convertToInternal(ast);
    logger('convertToInternal', internalAst);

    internalAst.firstAtrulesAllowed = ast.firstAtrulesAllowed;

    // remove useless
    internalWalkAll(internalAst, clean);
    logger('clean', internalAst);

    // compress nodes
    internalWalkAll(internalAst, compress);
    logger('compress', internalAst);

    // structure optimisations
    if (restructuring) {
        restructureAst(internalAst, logger);
    }

    return internalAst;
}

module.exports = function compress(ast, options) {
    ast = ast || [{}, 'stylesheet'];
    options = options || {};

    var logger = typeof options.logger === 'function' ? options.logger : Function();
    var restructuring =
        'restructure' in options ? options.restructure :
        'restructuring' in options ? options.restructuring :
        true;
    var result = new List();
    var block = { offset: 2 };
    var firstAtrulesAllowed = true;
    var blockNum = 1;
    var blockRules;

    if (typeof ast[0] === 'string') {
        injectInfo([ast]);
    }

    do {
        block = readBlock(ast, block.offset);
        block.stylesheet.firstAtrulesAllowed = firstAtrulesAllowed;
        block.stylesheet = compressBlock(block.stylesheet, restructuring, blockNum++, logger);
        blockRules = block.stylesheet.rules;

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
            if (!blockRules.isEmpty()) {
                result.insert(List.createItem({
                    type: 'Raw',
                    value: '\n'
                }));
            }
        }

        if (firstAtrulesAllowed && !blockRules.isEmpty()) {
            var lastRule = blockRules.last();

            if (lastRule.type !== 'Atrule' ||
               (lastRule.name !== 'import' && lastRule.name !== 'charset')) {
                firstAtrulesAllowed = false;
            }
        }

        result.appendList(blockRules);
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
