var fs = require('fs'),
    parse = require('./lib/cssp').parse,
    utils = require('./lib/utils');

if (process.argv.length === 3) {
    console.log(utils.basic2string(parse(fs.readFileSync(process.argv[2]).toString()), ''));
}
