function cleanInfo(tree){
    var res = tree.slice(1);

    for (var i = 1, token; token = res[i]; i++) {
        if (Array.isArray(token)) {
            res[i] = cleanInfo(token);
        }
    }

    return res;
}

function indent(num) {
    return new Array(num + 1).join('  ');
}

function ircToString(o) {
    return '{' + o.f + ', ' + o.l + '}';
}

function treeToString(tree, level) {
    level = level || 0;

    return (level ? '\n' + indent(level) : '') +
        '[' +
            tree.map(function(token) {
                if (Array.isArray(token)) {
                    return treeToString(token, level + 1);
                }

                // TODO: looks like info with `f` and `l` properties 
                // is never used, remove it?
                if (token.f !== undefined) {
                    return ircToString(token);
                }

                return '\'' + token.toString() + '\'';
            }).join(', ') +
        ']';
}

function printTree(tree) {
    console.log(treeToString(tree));
}

module.exports = {
    cleanInfo: cleanInfo,
    treeToString: treeToString,
    printTree: printTree
};
