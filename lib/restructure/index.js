var prepare = require('./prepare/index.js');
var initialMergeRuleset = require('./1-initialMergeRuleset.js');
var mergeAtrule = require('./2-mergeAtrule.js');
var disjoinRuleset = require('./3-disjoinRuleset.js');
var restructShorthand = require('./4-restructShorthand.js');
var restructBlock = require('./6-restructBlock.js');
var mergeRuleset = require('./7-mergeRuleset.js');
var restructRuleset = require('./8-restructRuleset.js');

module.exports = function(ast, options) {
    // prepare ast for restructing
    var indexer = prepare(ast, options);
    options.logger('prepare', ast);

    initialMergeRuleset(ast);
    options.logger('initialMergeRuleset', ast);

    mergeAtrule(ast);
    options.logger('mergeAtrule', ast);

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
