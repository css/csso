const { generate } = require('css-tree');

class Index {
    constructor() {
        this.seed = 0;
        this.map = Object.create(null);
    }

    resolve(str) {
        let index = this.map[str];

        if (!index) {
            index = ++this.seed;
            this.map[str] = index;
        }

        return index;
    }
}

module.exports = function createDeclarationIndexer() {
    const ids = new Index();

    return function markDeclaration(node) {
        const id = generate(node);

        node.id = ids.resolve(id);
        node.length = id.length;
        node.fingerprint = null;

        return node;
    };
};
