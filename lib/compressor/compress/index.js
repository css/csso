var compressValue = require('./value.js');
var color = require('./color.js');
var utils = require('../utils');

module.exports = {
    number: function(node) {
        var value = utils.packNumber(node.value);

        node.value = value;
        node.info.s = value;
    },

    string: function(node) {
        // remove escaped \n, i.e.
        // .a { content: "foo\
        // bar"}
        // ->
        // .a { content: "foobar" }
        node.value = node.value.replace(/\\\n/g, '');
    },

    vhash: color.compressHex,
    ident: color.compressIdent,
    funktion: color.compressFunction,

    dimension: require('./dimension.js'),

    // dimension: require('./dimension.js'),
    declaration: function(node) {
        var property = node.property.name.value;
        var value = node.value;

        compressValue(property, value);
    }
};
