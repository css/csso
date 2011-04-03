var fs = require('fs'),
    parse = require('./cssp').parse,
    minimize = require('./cssm').minimize,
    utils = require('./cssoutils');

if (process.argv.length === 3) {
    console.log(utils.min2string(minimize(parse(fs.readFileSync(process.argv[2]).toString())).nodes, ''));
}
