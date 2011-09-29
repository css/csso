var util = require('./util.js'),
    parser = require('./parser.js'),
    translator = require('./translator.js'),
    compressor = require('./compressor.js');

var parse = exports.parse = parser.parse;

var cleanInfo = exports.cleanInfo = util.cleanInfo;

exports.treeToString = util.treeToString;

exports.printTree = util.printTree;

var translate = exports.translate = translator.translate;

var compress = exports.compress = compressor.compress;

exports.justDoIt = function(src, ro) {
    return translate(cleanInfo(compress(parse(src, 'stylesheet'), ro)));
};
