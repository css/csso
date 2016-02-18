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

function compareRulesets(ruleset1, ruleset2) {
    var result = {
        eq: [],
        ne1: [],
        ne2: [],
        ne2overrided: []
    };

    var items1 = ruleset1.block.declarations;  // token
    var items2 = ruleset2.block.declarations;  // prev
    var hash1 = getHash(items1);
    var hash2 = getHash(items2);
    var fingerprints = Object.create(null);

    items1.each(function(data) {
        if (data.info.fingerprint) {
            fingerprints[data.info.fingerprint] = true;
        }

        if (hash2[data.info.s]) {
            result.eq.push(data);
        } else {
            result.ne1.push(data);
        }
    });

    items2.each(function(data) {
        if (!hash1[data.info.s]) {
            // if ruleset1 has overriding declaration, this is not a difference
            if (!fingerprints[data.info.fingerprint]) {
                result.ne2.push(data);
            } else {
                result.ne2overrided.push(data);
            }
        }
    });

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
    compareRulesets: compareRulesets,
    addToSelector: addToSelector
};
