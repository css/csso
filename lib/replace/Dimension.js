const packNumber = require('./Number').pack;

const LENGTH_UNIT = {
    // absolute length units
    'px': true,
    'mm': true,
    'cm': true,
    'in': true,
    'pt': true,
    'pc': true,

    // relative length units
    'em': true,
    'ex': true,
    'ch': true,
    'rem': true,

    // viewport-percentage lengths
    'vh': true,
    'vw': true,
    'vmin': true,
    'vmax': true,
    'vm': true
};

module.exports = function compressDimension(node, item) {
    const value = packNumber(node.value, item);

    node.value = value;

    if (value === '0' && this.declaration !== null && this.atrulePrelude === null) {
        const unit = node.unit.toLowerCase();

        // only length values can be compressed
        if (!Object.prototype.hasOwnProperty.call(LENGTH_UNIT, unit)) {
            return;
        }

        // issue #362: shouldn't remove unit in -ms-flex since it breaks flex in IE10/11
        // issue #200: shouldn't remove unit in flex since it breaks flex in IE10/11
        if (this.declaration.property === '-ms-flex' ||
            this.declaration.property === 'flex') {
            return;
        }

        // issue #222: don't remove units inside calc
        if (this.function && this.function.name === 'calc') {
            return;
        }

        item.data = {
            type: 'Number',
            loc: node.loc,
            value
        };
    }
};
