module.exports = function stringify(ast, withInfo) {
    function clean(source) {
        if (source && typeof source.toJSON === 'function') {
            source = source.toJSON();
        }

        if (Array.isArray(source)) {
            return source.map(clean);
        }

        if (source && typeof source === 'object') {
            var result = {};
            for (var key in source) {
                if ((withInfo || key !== 'info') &&
                    key !== 'id' && key !== 'length' &&
                    key !== 'fingerprint' && key !== 'compareMarker' &&
                    key !== 'pseudoSignature' && key !== 'avoidRulesMerge') {
                    result[key] = clean(source[key]);
                }
            }
            return result;
        }

        return source;
    }

    return JSON.stringify(clean(ast), null, 4);
};
