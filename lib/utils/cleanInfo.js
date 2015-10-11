module.exports = function cleanInfo(tree) {
    var res = tree.slice(1);

    for (var i = 1, token; token = res[i]; i++) {
        if (Array.isArray(token)) {
            res[i] = cleanInfo(token);
        }
    }

    return res;
};
