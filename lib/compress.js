var List = require('css-tree').List;
var clone = require('css-tree').clone;
var usageUtils = require('./usage');
var clean = require('./clean');
var replace = require('./replace');
var restructureBlock = require('./restructure');
var walkRules = require('css-tree').walkRules;

function readChunk(children, specialComments) {
    var buffer = new List();
    var nonSpaceTokenInBuffer = false;
    var protectedComment;

    children.nextUntil(children.head, function(node, item, list) {
        if (node.type === 'Comment') {
            if (!specialComments || node.value.charAt(0) !== '!') {
                list.remove(item);
                return;
            }

            if (nonSpaceTokenInBuffer || protectedComment) {
                return true;
            }

            list.remove(item);
            protectedComment = node;
            return;
        }

        if (node.type !== 'WhiteSpace') {
            nonSpaceTokenInBuffer = true;
        }

        buffer.insert(list.remove(item));
    });

    return {
        comment: protectedComment,
        stylesheet: {
            type: 'StyleSheet',
            loc: null,
            children: buffer
        }
    };
}

function compressChunk(ast, firstAtrulesAllowed, usageData, num, logger) {
    logger('Compress block #' + num, null, true);

    var seed = 1;

    if (ast.type === 'StyleSheet') {
        ast.firstAtrulesAllowed = firstAtrulesAllowed;
        ast.id = seed++;
    }

    walkRules(ast, function markScopes(node) {
        if (node.type === 'Atrule' && node.block !== null) {
            node.block.id = seed++;
        }
    });
    logger('init', ast);

    // remove redundant
    clean(ast, usageData);
    logger('clean', ast);

    // replace nodes for shortened forms
    replace(ast, usageData);
    logger('replace', ast);

    return ast;
}

function getCommentsOption(options) {
    var comments = 'comments' in options ? options.comments : 'exclamation';

    if (typeof comments === 'boolean') {
        comments = comments ? 'exclamation' : false;
    } else if (comments !== 'exclamation' && comments !== 'first-exclamation') {
        comments = false;
    }

    return comments;
}

function getRestructureOption(options) {
    return 'restructure' in options ? options.restructure :
           'restructuring' in options ? options.restructuring :
           true;
}

function wrapBlock(block) {
    return new List().appendData({
        type: 'Rule',
        selector: {
            type: 'SelectorList',
            children: new List().appendData({
                type: 'Selector',
                children: new List().appendData({
                    type: 'Identifier',
                    name: 'x'
                })
            })
        },
        block: block
    });
}

module.exports = function compress(ast, options) {
    ast = ast || { type: 'StyleSheet', loc: null, children: new List() };
    options = options || {};

    var logger = typeof options.logger === 'function' ? options.logger : function() {};
    var specialComments = getCommentsOption(options);
    var restructuring = getRestructureOption(options);
    var firstAtrulesAllowed = true;
    var usageData = false;
    var inputRules;
    var outputRules = new List();
    var chunk;
    var chunkNum = 1;
    var chunkRules;

    if (options.clone) {
        ast = clone(ast);
    }

    if (ast.type === 'StyleSheet') {
        inputRules = ast.children;
        ast.children = outputRules;
    } else {
        inputRules = wrapBlock(ast);
    }

    if (options.usage) {
        usageData = usageUtils.buildIndex(options.usage);
    }

    do {
        chunk = readChunk(inputRules, Boolean(specialComments));

        compressChunk(chunk.stylesheet, firstAtrulesAllowed, usageData, chunkNum++, logger);

        // structure optimisations
        if (restructuring) {
            restructureBlock(chunk.stylesheet, usageData, logger);
        }

        chunkRules = chunk.stylesheet.children;

        if (chunk.comment) {
            // add \n before comment if there is another content in outputRules
            if (!outputRules.isEmpty()) {
                outputRules.insert(List.createItem({
                    type: 'Raw',
                    value: '\n'
                }));
            }

            outputRules.insert(List.createItem(chunk.comment));

            // add \n after comment if chunk is not empty
            if (!chunkRules.isEmpty()) {
                outputRules.insert(List.createItem({
                    type: 'Raw',
                    value: '\n'
                }));
            }
        }

        if (firstAtrulesAllowed && !chunkRules.isEmpty()) {
            var lastRule = chunkRules.last();

            if (lastRule.type !== 'Atrule' ||
               (lastRule.name !== 'import' && lastRule.name !== 'charset')) {
                firstAtrulesAllowed = false;
            }
        }

        if (specialComments !== 'exclamation') {
            specialComments = false;
        }

        outputRules.appendList(chunkRules);
    } while (!inputRules.isEmpty());

    return {
        ast: ast
    };
};
