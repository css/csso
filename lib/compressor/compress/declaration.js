var compressValue = require('./value.js');

module.exports = function(node) {
    var property = node.property.name.value;
    var value = node.value;

    compressValue(property, value);
};
