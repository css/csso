module.exports = function compressFontWeight(node) {
    var value = node.sequence[0];

    if (value.type === 'Identifier') {
        switch (value.name) {
            case 'normal':
                node.sequence[0] = {
                    type: 'Number',
                    info: value.info,
                    value: '400'
                };
                break;
            case 'bold':
                node.sequence[0] = {
                    type: 'Number',
                    info: value.info,
                    value: '700'
                };
                break;
        }
    }
};
