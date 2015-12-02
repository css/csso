function copyObject(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

function copyArray(token) {
    var result = token.slice();

    result[0] = copyObject(token[0]);

    for (var i = 2; i < token.length; i++) {
        if (Array.isArray(token[i])) {
            result[i] = copyArray(token[i]);
        }
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

function getHash(tokens) {
    var hash = {};

    for (var i = 2; i < tokens.length; i++) {
        hash[tokens[i][0].s] = true;
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
        ne2: []
    };

    if (ruleset1[1] !== ruleset2[1]) {
        return result;
    }

    var items1 = ruleset1[3];  // token
    var items2 = ruleset2[3];  // prev
    var hash1 = getHash(items1);
    var hash2 = getHash(items2);
    var fingerprints = {};

    for (var i = 2; i < items1.length; i++) {
        if (items1[i][0].fingerprint) {
            fingerprints[items1[i][0].fingerprint] = true;
        }
    }

    for (var i = 2; i < items1.length; i++) {
        var item = items1[i];

        if (item[0].s in hash2) {
            result.eq.push(item);
        } else {
            result.ne1.push(item);
        }
    }

    for (var i = 2; i < items2.length; i++) {
        var item = items2[i];

        if (item[0].s in hash1 === false &&
            // if ruleset1 has overriding declaration, this is not a difference
            item[0].fingerprint in fingerprints === false) {
            result.ne2.push(item);
        }
    }

    return result;
}

function addToSelector(dest, source) {
    ignore:
    for (var i = 2; i < source.length; i++) {
        var simpleSelectorStr = source[i][0].s;
        for (var j = dest.length; j > 2; j--) {
            var prevSimpleSelectorStr = dest[j - 1][0].s;
            if (prevSimpleSelectorStr === simpleSelectorStr) {
                continue ignore;
            }
            if (prevSimpleSelectorStr < simpleSelectorStr) {
                break;
            }
        }
        dest.splice(j, 0, source[i]);
    }

    return dest;
}

function append(dest, source) {
    for (var i = 2; i < source.length; i++) {
        dest.push(source[i]);
    }
}

function isCompatibleSignatures(token1, token2) {
    var info1 = token1[0];
    var info2 = token2[0];

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
    copyArray: copyArray,
    equalHash: equalHash,
    getHash: getHash,
    hashInHash: hashInHash,
    isCompatibleSignatures: isCompatibleSignatures,
    compareRulesets: compareRulesets,
    addToSelector: addToSelector,
    append: append
};
