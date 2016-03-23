var hasOwnProperty = Object.prototype.hasOwnProperty;
var translate = require('../../ast/translate.js');

function Index(fn) {
    this.map = Object.create(null);
    this.fn = fn;
}

Index.prototype = {
    add: function(node) {
        var id = this.fn(node);

        node.id = id;

        if (hasOwnProperty.call(this.map, id)) {
            this.map[id]++;
        } else {
            this.map[id] = 1;
        }

        return node;
    },

    remove: function(node) {
        if (hasOwnProperty.call(this.map, node.id)) {
            this.map[node.id]--;
        }
    },

    count: function(node) {
        if (hasOwnProperty.call(this.map, node.id)) {
            return this.map[node.id];
        }

        return 0;
    }
};

module.exports = function createIndexer() {
    return {
        declaration: new Index(function(node) {
            return node.property.name + ':' + translate(node.value);
        })
    };
};
