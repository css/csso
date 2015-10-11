var constants = require('./const.js');

function initRules(config) {
    var store = {};
    var order = constants.order;
    var profile = constants.profile;
    var rules = order.filter(function(key) {
        return key in config;
    });

    if (!rules.length) {
        rules = order;
    }

    rules.forEach(function(rule) {
        Object.keys(profile[rule]).forEach(function(key) {
            if (store[key]) {
                store[key].push(rule);
            } else {
                store[key] = [rule];
            }
        });
    });

    return store;
};

module.exports = {
    cleanComments: initRules(constants.cleanCfg), // special case to resolve ambiguity
    compress: initRules(constants.defCCfg),
    prepare: initRules(constants.preCfg),
    freezeRuleset: initRules(constants.frCfg),
    markShorthand: initRules(constants.msCfg),
    cleanShortcut: initRules(constants.csCfg),
    restructureBlock: initRules(constants.defRBCfg),
    rejoinRuleset: initRules(constants.defRJCfg),
    restructureRuleset: initRules(constants.defRRCfg),
    finalize: initRules(constants.defFCfg)
};
