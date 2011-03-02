var fs = require('fs'),
    parse = require('./lib/cssp').parse,
    minimize = require('./lib/cssm').minimize,
    utils = require('./lib/utils');

if (process.argv.length === 3) {
//    console.log(utils.min2string(minimize(parse(fs.readFileSync(process.argv[2]).toString())).nodes, ''));
    console.log(utils.dump2string(minimize(parse(fs.readFileSync(process.argv[2]).toString())).nodes, ''));

}
