var fs = require('fs'),
    parse = require('./cssp').parse,
    minimize = require('./cssm').minimize,
    utils = require('./cssoutils'),
    args = process.argv;

if (args.length === 3) {
    switch (args[2]) {
        case '--help':
            printFile('USAGE');
            break;
        case '--version':
            printFile('VERSION');
            break;
        default:
            console.log(utils.min2string(minimize(parse(fs.readFileSync(process.argv[2]).toString())).nodes, ''));
    }
} else printFile('USAGE');

function printFile(filename) {
    console.log(fs.readFileSync(__dirname.slice(0, __dirname.lastIndexOf('/')) + '/' + filename).toString());
}
