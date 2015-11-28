function packNumber(value) {
    // 100 -> '100'
    // 00100 -> '100'
    // +100 -> '100'
    // -100 -> '-100'
    // 0.123 -> '.123'
    // 0.12300 -> '.123'
    // 0.0 -> ''
    // 0 -> ''
    value = String(value).replace(/^(?:\+|(-))?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/, '$1$2$3');

    if (value === '' || value === '-') {
        value = '0';
    }

    return value;
}

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

module.exports = {
    packNumber: packNumber,
    copyObject: copyObject,
    copyArray: copyArray,
    equalHash: equalHash,
    getHash: getHash,
    hashInHash: hashInHash
};
