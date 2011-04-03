var fs = require('fs'),
    parse = require('./cssp').parse,
    minimize = require('./cssm').minimize,
    utils = require('./cssoutils'),
    args = process.argv;

if (args.length === 3) {
    switch (args[2]) {
        case '--help':
            printHelp();
            break;
        case '--version':
            printVersion();
            break;
        default:
            console.log(utils.min2string(minimize(parse(fs.readFileSync(process.argv[2]).toString())).nodes, ''));
    }
}

function printHelp() {
    console.log(fs.readFileSync(__dirname.slice(0, __dirname.lastIndexOf('/')) + '/USAGE').toString());
}

function printVersion() {
    console.log(fs.readFileSync(__dirname.slice(0, __dirname.lastIndexOf('/')) + '/VERSION').toString());
}
