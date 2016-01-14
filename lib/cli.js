var fs = require('fs');
var cli = require('clap');
var csso = require('./index.js');

function readFromStream(stream, minify) {
    var buffer = [];

    stream
        .setEncoding('utf8')
        .on('data', function(chunk) {
            buffer.push(chunk);
        })
        .on('end', function() {
            minify(buffer.join(''));
        });
}

function stat(filename, source, result, time, mem) {
    function fmt(size) {
        return String(size).replace(/\B\d{3}$/, ' $&');
    }

    console.error('File:      ', filename);
    console.error('Original:  ', fmt(source), 'bytes');
    console.error('Compressed:', fmt(result), 'bytes', '(' + (100 * result / source).toFixed(2) + '%)');
    console.error('Saving:    ', fmt(source - result), 'bytes', '(' + (100 * (source - result) / source).toFixed(2) + '%)');
    console.error('Time:      ', time, 'ms');
    console.error('Memory:    ', (mem / (1024 * 1024)).toFixed(3), 'MB');
}

function debugLevel(level) {
    // level is undefined when no param -> 1
    return isNaN(level) ? 1 : Math.max(Number(level), 0);
}

var command = cli.create('csso', '[input] [output]')
    .version(require('../package.json').version)
    .option('-i, --input <filename>', 'Input file')
    .option('-o, --output <filename>', 'Output file (result outputs to stdout if not set)')
    .option('--restructure-off', 'Turns structure minimization off')
    .option('--stat', 'Output statistics in stderr')
    .option('--debug [level]', 'Output intermediate state of CSS during compression', debugLevel, 0)
    .action(function(args) {
        var inputFile = this.values.input || args[0];
        var outputFile = this.values.output || args[1];

        if (process.stdin.isTTY && !inputFile && !outputFile) {
            this.showHelp();
            return;
        }

        var structureOptimisationOff = this.values.restructureOff;
        var debug = this.values.debug;
        var input = inputFile ? fs.createReadStream(inputFile) : process.stdin;
        var statistics = this.values.stat;

        readFromStream(input, function(source) {
            var time = process.hrtime();
            var mem = process.memoryUsage().heapUsed;

            var result = csso.minify(source, {
                restructuring: !structureOptimisationOff,
                debug: debug
            });

            if (statistics) {
                var timeDiff = process.hrtime(time);
                stat(
                    inputFile || '<stdin>',
                    source.length,
                    result.length,
                    parseInt(timeDiff[0] * 1e3 + timeDiff[1] / 1e6),
                    process.memoryUsage().heapUsed - mem
                );
            }

            if (outputFile) {
                fs.writeFileSync(outputFile, result, 'utf-8');
            } else {
                console.log(result);
            }
        });
    });

module.exports = {
    run: command.run.bind(command),
    isCliError: function(err) {
        return err instanceof cli.Error;
    }
};
