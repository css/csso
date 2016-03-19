var hasOwnProperty = Object.prototype.hasOwnProperty;

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
    var classes = buildMap(data.classes);
    var scopes = false;

    if (data.scopes && Array.isArray(data.scopes)) {
        scopes = Object.create(null);

        for (var i = 0; i < data.scopes.length; i++) {
            var list = data.scopes[i];

            if (!list || !Array.isArray(list)) {
                throw new Error('Wrong usage format');
            }

            for (var j = 0; j < list.length; j++) {
                var name = list[j];

                if (hasOwnProperty.call(scopes, name)) {
                    throw new Error('Class can\'t be used for several scopes: ' + name);
                }

                scopes[name] = i + 1;
                if (classes) {
                    classes[name] = true;
                }
            }
        }
    }

    return {
        tags: buildMap(data.tags),
        ids: buildMap(data.ids),
        classes: classes,
        scopes: scopes
    };
}

module.exports = {
    buildIndex: buildIndex
};
