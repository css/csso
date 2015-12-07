var compressValue = require('./Value_.js');

module.exports = function(node) {
    var property = node.property.name;
    var value = node.value;

    compressValue(property, value);
};
