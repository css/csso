var compressValue = require('./Value.js');

module.exports = function(node) {
    var property = node.property.name;
    var value = node.value;

    compressValue(property, value);
};
