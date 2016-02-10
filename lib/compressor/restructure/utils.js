function copyObject(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

function equalHash(h0, h1) {
    for (var key in h0) {
        if (key in h1 === false) {
            return false;
        }
    }

    for (var key in h1) {
        if (key in h0 === false) {
            return false;
        }
    }

    return true;
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

function getHash(list) {
    var hash = {};

    list.each(function(data) {
        hash[data.info.s] = true;
    });

    return hash;
}

function hashInHash(hash1, hash2) {
    for (var key in hash1) {
        if (key in hash2 === false) {
            return false;
        }
    }

    return true;
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
    var fingerprints = {};

    items1.each(function(data) {
        if (data.info.fingerprint) {
            fingerprints[data.info.fingerprint] = true;
        }

        if (data.info.s in hash2) {
            result.eq.push(data);
        } else {
            result.ne1.push(data);
        }
    });

    items2.each(function(data) {
        if (data.info.s in hash1 === false) {
            // if ruleset1 has overriding declaration, this is not a difference
            if (data.info.fingerprint in fingerprints === false) {
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

function isCompatibleSignatures(token1, token2) {
    var info1 = token1.info;
    var info2 = token2.info;

    // same frozen ruleset
    if (info1.freezeID === info2.freezeID) {
        return true;
    }

    // same pseudo-classes in selectors
    if (info1.pseudoID === info2.pseudoID) {
        return true;
    }

    // different frozen rulesets
    if (info1.freeze && info2.freeze) {
        var signature1 = info1.pseudoSignature;
        var signature2 = info2.pseudoSignature;

        return signature1 === signature2;
    }

    // is it frozen at all?
    return !info1.freeze && !info2.freeze;
}

module.exports = {
    copyObject: copyObject,
    equalHash: equalHash,
    isEqualLists: isEqualLists,
    hashInHash: hashInHash,
    isCompatibleSignatures: isCompatibleSignatures,
    compareRulesets: compareRulesets,
    addToSelector: addToSelector
};
