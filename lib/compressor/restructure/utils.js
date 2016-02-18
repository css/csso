function copyObject(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

function isEqualLists(a, b) {
    var cursor1 = a.head;
    var cursor2 = b.head;

    while (cursor1 && cursor2 && cursor1.data.info.s === cursor2.data.info.s) {
        cursor1 = cursor1.next;
        cursor2 = cursor2.next;
    }

    return cursor1 === null && cursor2 === null;
}

function hashInHash(hash1, hash2) {
    for (var key in hash1) {
        if (key in hash2 === false) {
            return false;
        }
    }

    return true;
}

function getHash(list) {
    var result = Object.create(null);

    list.each(function(data) {
        result[data.info.s] = true;
    });

    return result;
}

function compareDeclarations(declarations1, declarations2) {
    var result = {
        eq: [],
        ne1: [],
        ne2: [],
        ne2overrided: []
    };

    var fingerprints = Object.create(null);
    var declarations2hash = Object.create(null);

    for (var cursor = declarations2.head; cursor; cursor = cursor.next)  {
        declarations2hash[cursor.data.info.s] = true;
    }

    for (var cursor = declarations1.head; cursor; cursor = cursor.next)  {
        var data = cursor.data;

        if (data.info.fingerprint) {
            fingerprints[data.info.fingerprint] = true;
        }

        if (declarations2hash[data.info.s]) {
            declarations2hash[data.info.s] = false;
            result.eq.push(data);
        } else {
            result.ne1.push(data);
        }
    }

    for (var cursor = declarations2.head; cursor; cursor = cursor.next)  {
        var data = cursor.data;

        if (declarations2hash[data.info.s]) {
            // if declarations1 has overriding declaration, this is not a difference
            if (!fingerprints[data.info.fingerprint]) {
                result.ne2.push(data);
            } else {
                result.ne2overrided.push(data);
            }
        }
    }

    return result;
}

function addToSelector(dest, source) {
    source.each(function(sourceData, sourceItem) {
        var newStr = sourceData.info.s;
        var cursor = dest.head;

        while (cursor) {
            var nextStr = cursor.data.info.s;

            if (nextStr === newStr) {
                return;
            }

            if (nextStr > newStr) {
                break;
            }

            cursor = cursor.next;
        }

        dest.insert(dest.createItem(sourceData), cursor);
    });

    return dest;
}

module.exports = {
    copyObject: copyObject,
    isEqualLists: isEqualLists,
    hashInHash: hashInHash,
    compareDeclarations: compareDeclarations,
    addToSelector: addToSelector
};
