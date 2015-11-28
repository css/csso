var compressValue = require('./value.js');
var color = require('./color.js');
var utils = require('../utils');

module.exports = {
    number: function(node) {
        node.value = utils.packNumber(node.value);
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

    declaration: function(node) {
        var property = node.property.name.value;
        var value = node.value;

        compressValue(property, value);
    },

    attrib: require('./attrib.js')
};
