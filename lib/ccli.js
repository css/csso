var fs = require('fs'),
    parse = require('./cssp').parse,
    minimize = require('./cssm').minimize,
    utils = require('./cssoutils'),
    args = process.argv.slice(2),
    opts = args.length ? getOpts(args, [
                '-v', '--version',     // print version
                '-h', '--help',        // print help
                '-r', '--restructure', // turn off restructure
                '--dumptree'           // dump parsed tree
            ]) : null,
    config = opts && {
        dontRestructure: (opts.single.contains('-r') || opts.single.contains('-restructure'))
    },
    single = opts && opts.single,
    pairs = opts && opts.pairs,
    other = opts && opts.other,
    fileName = other && other[0];

if (!opts || single.contains(['-h', '--help']) || other.length > 1) {
    printFile('USAGE');
} else if (single.contains(['-v', '--version'])) {
    printFile('VERSION');
} else {
    if (single.contains('--dumptree')) {
        console.log(utils.dump2string(parse(fs.readFileSync(fileName).toString()).nodes));
    } else {
        console.log(utils.min2string(minimize(parse(fs.readFileSync(fileName).toString()), config).nodes, ''));
    }
}

function getOpts(argv, o_single, o_pairs) {
    var opts = { single : [], pairs : {}, other : [] },
        arg,
        i = 0;

    for (; i < argv.length;) {
        arg = argv[i];
        if (o_single && o_single.indexOf(arg) !== -1 && (!o_pairs || o_pairs.indexOf(arg) === -1)) {
            opts.single.push(arg);
        } else if (o_pairs && o_pairs.indexOf(arg) !== -1 && (!o_single || o_single.indexOf(arg) === -1)) {
            opts.pairs[arg] = argv[++i];
        } else opts.other.push(arg);
        i++;
    }

    opts.single.contains = function(value) {
        if (typeof value === 'string') {
            return this.indexOf(value) !== -1;
        } else {
            for (var i = 0; i < value.length; i++) if (this.indexOf(value[i]) !== -1) return true;
        }
        return false;
    };

    return opts;
}

function printFile(filename) {
    console.log(fs.readFileSync(__dirname.slice(0, __dirname.lastIndexOf('/')) + '/' + filename).toString());
}
