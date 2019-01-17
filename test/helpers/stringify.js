module.exports = function stringify(ast, withInfo) {
    function clean(source) {
        if (source && typeof source.toJSON === 'function') {
            source = source.toJSON();
        }

        if (Array.isArray(source)) {
            return source.map(clean);
        }

        if (source && typeof source === 'object') {
            const result = {};
            for (const key in source) {
                if (withInfo || key !== 'info') {
                    result[key] = clean(source[key]);
                }
            }

            return result;
        }

        return source;
    }

    return JSON.stringify(clean(ast), null, 4);
};
