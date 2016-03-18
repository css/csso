function buildMap(list) {
    var map = Object.create(null);

    if (!Array.isArray(list)) {
        return false;
    }

    for (var i = 0; i < list.length; i++) {
        map[list[i]] = true;
    }

    return map;
}

function buildIndex(data) {
    var index = {
        tags: buildMap(data.tags),
        ids: buildMap(data.ids),
        classes: buildMap(data.classes),
        scopes: null
    };

    return index;
}

module.exports = {
    buildIndex: buildIndex
};
