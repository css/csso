var CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var BASE = CHARS.length;
var PROPERTIES = ['classes'];
var defaults = {};

function createRenameFunction() {
    var map = {};
    var seed = 1;

    return function(name) {
        if (hasOwnProperty.call(map, name)) {
            return map[name];
        }

        var newName = '';
        var num = seed++;
        var charIndex;

        // a b c ... X Y Z aa ab ab ...
        do {
            charIndex = num % BASE;
            num = Math.floor(num / BASE);
            if (num === 0 && charIndex > 0) {
                charIndex--;
            }
            newName = CHARS.charAt(charIndex) + newName;
        } while (num);

        map[name] = newName;

        return newName;
    };
}

function process(value, name) {
    if (typeof value === 'function') {
        return value;
    }

    if (value) {
        return defaults[name] || createRenameFunction();
    }

    return false;
}

module.exports = function(options) {
    if (options.rename) {
        return PROPERTIES.reduce(function(result, key) {
            var value = process(options.rename[key], key);

            if (value !== false) {
                var map = {};
                result.map[key] = map;
                result[key] = function(name) {
                    return map[name] = value(name);
                };
            } else {
                result[key] = value;
            }

            return result;
        }, { map: {} });
    }

    return false;
};
