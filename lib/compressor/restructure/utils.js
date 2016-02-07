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

function getSelectorHash(selectors) {
    var hash = {};

    selectors.each(function(data) {
        hash[data.info.s] = true;
    });

    return hash;
}

function getHash(tokens) {
    var hash = {};

    for (var i = 0; i < tokens.length; i++) {
        hash[tokens[i].info.s] = true;
    }

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

    for (var i = 0; i < items1.length; i++) {
        if (items1[i].info.fingerprint) {
            fingerprints[items1[i].info.fingerprint] = true;
        }
    }

    for (var i = 0; i < items1.length; i++) {
        var item = items1[i];

        if (item.info.s in hash2) {
            result.eq.push(item);
        } else {
            result.ne1.push(item);
        }
    }

    for (var i = 0; i < items2.length; i++) {
        var item = items2[i];

        if (item.info.s in hash1 === false) {
            // if ruleset1 has overriding declaration, this is not a difference
            if (item.info.fingerprint in fingerprints === false) {
                result.ne2.push(item);
            } else {
                result.ne2overrided.push(item);
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
    getSelectorHash: getSelectorHash,
    hashInHash: hashInHash,
    isCompatibleSignatures: isCompatibleSignatures,
    compareRulesets: compareRulesets,
    addToSelector: addToSelector
};
