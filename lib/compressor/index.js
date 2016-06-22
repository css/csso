var List = require('../utils/list');
var clone = require('../utils/clone');
var settings = require('./settings');
var clean = require('./clean');
var compress = require('./compress');
var rename = require('./rename');
var restructureBlock = require('./restructure');
var walkRules = require('../utils/walk').rules;

function readRulesChunk(rules, specialComments) {
    var buffer = new List();
    var nonSpaceTokenInBuffer = false;
    var protectedComment;

    rules.nextUntil(rules.head, function(node, item, list) {
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

        if (node.type !== 'Space') {
            nonSpaceTokenInBuffer = true;
        }

        buffer.insert(list.remove(item));
    });

    return {
        comment: protectedComment,
        stylesheet: {
            type: 'StyleSheet',
            info: null,
            rules: buffer
        }
    };
}

function compressChunk(ast, firstAtrulesAllowed, usageData, renameSettings, logger) {
    var seed = 1;
    walkRules(ast, function markStylesheets() {
        if ('id' in this.stylesheet === false) {
            this.stylesheet.firstAtrulesAllowed = firstAtrulesAllowed;
            this.stylesheet.id = seed++;
        }
    });
    logger('init', ast);

    // remove redundant
    clean(ast, usageData);
    logger('clean', ast);

    // compress nodes
    compress(ast, usageData);
    logger('compress', ast);

    if (renameSettings) {
        rename(ast, renameSettings);
        logger('rename', ast);
    }

    return ast;
}

function wrapBlock(block) {
    return new List([{
        type: 'Ruleset',
        selector: {
            type: 'Selector',
            selectors: new List([{
                type: 'SimpleSelector',
                sequence: new List([{
                    type: 'Identifier',
                    name: 'x'
                }])
            }])
        },
        block: block
    }]);
}

module.exports = function compress(ast, options) {
    ast = ast || { type: 'StyleSheet', info: null, rules: new List() };
    options = options || {};

    var logger = typeof options.logger === 'function' ? options.logger : Function();
    var specialComments = settings.comments(options);
    var restructure = settings.restructure(options);
    var usageData = settings.usage(options);
    var rename = settings.rename(options);
    var firstAtrulesAllowed = true;
    var inputRules;
    var outputRules = new List();
    var chunk;
    var chunkNum = 1;
    var chunkRules;

    if (options.clone) {
        ast = clone(ast);
    }

    if (ast.type === 'StyleSheet') {
        inputRules = ast.rules;
        ast.rules = outputRules;
    } else {
        inputRules = wrapBlock(ast);
    }

    do {
        chunk = readRulesChunk(inputRules, Boolean(specialComments));

        logger('Compress block #' + (chunkNum++), null, true);
        compressChunk(chunk.stylesheet, firstAtrulesAllowed, usageData, rename, logger);

        // structure optimisations
        if (restructure) {
            restructureBlock(chunk.stylesheet, usageData, rename, logger);
        }

        chunkRules = chunk.stylesheet.rules;

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
        rename: rename ? rename.map : null,
        ast: ast
    };
};
