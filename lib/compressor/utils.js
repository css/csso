function packNumber(value) {
    value = value
        .replace(/^0+/, '')
        .replace(/\.0*$/, '')
        .replace(/(\..*\d+)0+$/, '$1');

    return value === '.' || value === '' ? '0' : value;
}

module.exports = {
    packNumber: packNumber
};
