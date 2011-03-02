var fs = require('fs'),
    parse = require('../../lib/cssp').parse,
    utils = require('../../lib/utils'),
    c_dir = './css',
    c_list = fs.readdirSync(c_dir),
    e_dir = './expected',
    e_list = fs.readdirSync(e_dir),
    c,
    e,
    fail = 0;

console.log('Parser tests');

c_list.forEach(function(name) {
    c = utils.dump2string(parse(fs.readFileSync(c_dir + '/' + name).toString()).nodes);
    try {
        e = fs.readFileSync(e_dir + '/' + name + '.dump').toString().trim();

        if (c !== e) {
            console.log('fail: ' + name);
            fail++;
        }
    } catch (e) {
        console.log('absent: ' + name + '.dump');
        fail++;
    }
});

console.log('Total: ' + c_list.length + ', failed: ' + fail);