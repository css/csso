var walk = require('../../utils/walker');
var translate = require('../../utils/translate');
var map = new WeakMap();

function getNode(value) {
    if (value instanceof Node) {
        return value;
    }

    if (Array.isArray(value)) {
        return map.get(value) || new types[value[1]](value);
    }
}

var Node = function(token) {
    this.token = token;
    this.parent = null;

    map.set(token, this);
};

Node.prototype = {
    token: null,
    parent: null,

    setParent: function(newParent) {
        if (this.parent && this.parent !== newParent) {
            this.remove();
        }
        this.parent = newParent || null;
    },
    translate: function() {
        return translate(this.token, true);
    },

    get info() {
        return this.token[0];
    },
    get type() {
        return this.token[1];
    },
    get length() {
        return this.token.length - 2;
    },

    get first() {
        var token = this.token[2];
        if (token) {
            return getNode(token) || token;
        }
    },
    get last() {
        if (!this.length) {
            return;
        }

        var token = this.token[this.token.length - 1];
        if (token) {
            return getNode(token) || token;
        }
    },
    get next() {
        if (!this.parent) {
            return;
        }

        var idx = this.parent.token.indexOf(this.token);
        var next;

        if (idx !== -1) {
            next = this.parent.token[idx + 1];
        }

        return next ? getNode(next) : null;
    },
    get prev() {
        if (!this.parent) {
            return;
        }

        var idx = this.parent.token.indexOf(this.token);
        var prev;

        if (idx !== -1 && idx > 2) {
            prev = this.parent.token[idx - 1];
        }

        return prev ? getNode(prev) : null;
    },

    append: function(token) {
        getNode(token).setParent(token);
        this.token.push(token);
    },
    insertBefore: function(token, before) {
        var idx = this.token.indexOf(getNode(before).token);

        if (idx === -1) {
            this.append(token);
        } else {
            getNode(token).setParent(this);
            this.token.splice(idx, 0, token);
        }
    },
    remove: function() {
        if (!this.parent) {
            return;
        }

        var parentToken = this.parent.token;
        var idx = parentToken.indexOf(this.token);

        if (idx !== -1) {
            parentToken.splice(idx, 1);
            this.parent = null;
        }
    },
    replace: function(newToken) {
        if (!this.parent) {
            return;
        }

        var parent = this.parent;
        var parentToken = this.parent.token;
        var idx = parentToken.indexOf(this.token);
        var newNode = getNode(newToken);

        if (idx !== -1) {
            newNode.setParent(this.parent);
            parentToken.splice(idx, 1, newToken);
            this.parent = null;
        }

        return newNode;
    },

    findBefore: function(check) {
        if (!this.parent) {
            return;
        }

        var tokens = this.parent.token;
        var idx = tokens.indexOf(this.token);

        if (idx === -1) {
            return;
        }

        for (var i = idx - 1; i >= 2; i--) {
            var node = getNode(tokens[i]);
            if (node && check(node)) {
                return node;
            }
        }
    },
    findAfter: function(check) {
        if (!this.parent) {
            return;
        }

        var tokens = this.parent.token;
        var idx = tokens.indexOf(this.token);

        if (idx === -1) {
            return;
        }

        for (var i = idx + 1; i < tokens.length - 1; i++) {
            var node = getNode(tokens[i]);
            if (node && check(node)) {
                return node;
            }
        }
    },

    each: function(fn) {
        if (!this.length) {
            return;
        }

        var tokens = this.token.slice(2);

        for (var i = 0; i < tokens.length; i++) {
            var node = getNode(tokens[i]);
            if (node) {
                fn(node);
            }
        };
    },
    eachRight: function(fn) {
        if (!this.length) {
            return;
        }

        var tokens = this.token.slice(2);

        for (var i = tokens.length - 1; i >= 0; i--) {
            var node = getNode(tokens[i]);
            if (node) {
                fn(node);
            }
        };
    },
    map: function(fn) {
        var tokens = this.token;
        var result = [];

        for (var i = 2; i < tokens.length; i++) {
            var node = getNode(tokens[i]);
            if (node) {
                result.push(fn(node));
            } else {
                result.push(tokens[i]);
            }
        }

        return result;
    },
    some: function(fn) {
        var tokens = this.token;

        for (var i = 2; i < tokens.length; i++) {
            var node = getNode(tokens[i]);
            if (node && fn(node)) {
                return true;
            }
        }

        return false;
    }
};

function createType() {
    function defineProperty(name, offset) {
        Object.defineProperty(Type.prototype, name, {
            get: function() {
                var value = this.token[offset];
                return getNode(value) || value;
            },
            set: function(token) {
                var node = getNode(token);

                if (node) {
                    node.setParent(this);
                }

                this.token[offset] = token;
            }
        });
    }

    var Type = function(token) {
        Node.call(this, token);
    };

    Type.prototype = Object.create(Node.prototype);

    for (var i = 0; i < arguments.length; i++) {
        defineProperty(arguments[i], i + 2);
    }

    return Type;
}

var Value = createType('value');
var Name = createType('name');

var types = {
    atkeyword: Name,
    atruleb: Node,
    atruler: createType('name', 'condition', 'block'),
    atrulerq: Node,
    atrulers: Node,
    atrules: Name,
    attrib: Node,
    attrselector: Node,
    block: Node,
    braces: Node,
    clazz: Name,
    combinator: Name,
    comment: Value,
    declaration: createType('property', 'value'),
    decldelim: Node,
    delim: Node,
    dimension: createType('number', 'unit'),
    filter: Node,
    filterv: Node,
    functionExpression: Node,
    funktion: createType('name', 'body'),
    functionBody: Node,
    ident: Value,
    important: Node,
    namespace: Node,
    nth: Value,
    nthselector: createType('name', 'expression'),
    number: Value,
    operator: Value,
    percentage: Value,
    progid: Node,
    property: Name,
    pseudoc: Name,
    pseudoe: Name,
    raw: Value,
    ruleset: createType('selector', 'block'),
    s: Value,
    selector: Node,
    shash: Name,
    simpleselector: Node,
    string: Value,
    stylesheet: Node,
    unary: Value,
    unknown: Node,
    uri: Node,
    value: Node,
    vhash: Value
};

module.exports = function(ast) {
    walk(ast, function(token, parent) {
        var node = getNode(token);

        if (parent) {
            node.setParent(map.get(parent));
        }
    }, true);

    var root = getNode(ast);

    root.walk = function walk(handlers) {
        function walk(node) {
            node.each(walk);

            var fn = handlers[node.type];
            if (fn) {
                fn(node, root);
            }
        }

        walk(this);
    };

    return root;
};
