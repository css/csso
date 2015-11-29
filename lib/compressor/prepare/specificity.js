var A = 3;
var B = 2;
var C = 1;

module.exports = function specificity(node) {
    var specificity = [0, 0, 0, 0];

    node.each(function walk(item) {
        switch (item.type) {
            case 'simpleselector':
                item.each(walk);
                break;

            case 'shash':
                specificity[C]++;
                break;

            case 'clazz':
            case 'attrib':
            case 'nthselector':
                specificity[B]++;
                break;

            case 'ident':
                if (item.value !== '*') {
                    specificity[A]++;
                }
                break;

            case 'pseudoe':
                specificity[A]++;
                break;
            case 'pseudoc':
                var type = item.name.type;
                if (type === 'ident') {
                    var name = item.name.value.toLowerCase();
                    if (name === 'before' ||
                        name === 'after' ||
                        name === 'first-line' ||
                        name === 'first-letter') {
                        specificity[A]++;
                    } else {
                        specificity[B]++;
                    }
                } else {
                    var name = item.name.name.value;
                    if (name === 'not') {
                        item.name.body.each(walk);
                    } else {
                        specificity[B]++;
                    }
                }
                break;
        }
    });

    return specificity;
};
