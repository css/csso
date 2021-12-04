const prepare = require('./prepare/index');
const mergeAtrule = require('./1-mergeAtrule');
const initialMergeRuleset = require('./2-initialMergeRuleset');
const disjoinRuleset = require('./3-disjoinRuleset');
const restructShorthand = require('./4-restructShorthand');
const restructBlock = require('./6-restructBlock');
const mergeRuleset = require('./7-mergeRuleset');
const restructRuleset = require('./8-restructRuleset');

module.exports = function(ast, options) {
    // prepare ast for restructing
    const indexer = prepare(ast, options);
    options.logger('prepare', ast);

    mergeAtrule(ast, options);
    options.logger('mergeAtrule', ast);

    initialMergeRuleset(ast);
    options.logger('initialMergeRuleset', ast);

    disjoinRuleset(ast);
    options.logger('disjoinRuleset', ast);

    restructShorthand(ast, indexer);
    options.logger('restructShorthand', ast);

    restructBlock(ast);
    options.logger('restructBlock', ast);

    mergeRuleset(ast);
    options.logger('mergeRuleset', ast);

    restructRuleset(ast);
    options.logger('restructRuleset', ast);
};
