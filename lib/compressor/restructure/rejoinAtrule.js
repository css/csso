function isMediaRule(token) {
    return token[1] === 'atruler' && token[2][2][2] === 'media';
}

module.exports = function rejoinAtrule(token, parent, i) {

    if (!isMediaRule(token)) {
        return;
    }

    var prev = i > 2 ? parent[i - 1] : null;

    if (!prev || !isMediaRule(prev)) {
        return;
    }

    // merge @media with same query
    if (token[3][0].s === prev[3][0].s) {
        Array.prototype.push.apply(prev[4], token[4].splice(2));
        return null;
    }
};
