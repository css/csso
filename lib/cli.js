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

function showStat(filename, source, result, time, mem) {
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

function showParseError(source, filename, details, message) {
    function processLines(start, end) {
        return lines.slice(start, end).map(function(line, idx) {
            var num = String(start + idx + 1);

            while (num.length < maxNumLength) {
                num = ' ' + num;
            }

            return num + ' |' + line;
        }).join('\n');
    }

    var lines = source.split(/\n|\r\n?|\f/);
    var column = details.column;
    var line = details.line;
    var startLine = Math.max(1, line - 2);
    var endLine = Math.min(line + 2, lines.length + 1);
    var maxNumLength = Math.max(4, String(endLine).length) + 1;

    console.error('\nCSS parse error' + (filename ? ' at ' + filename : '') + ' line #' + line + ': ' + message);
    console.error(processLines(startLine - 1, line));
    console.error(new Array(column + maxNumLength + 2).join('-') + '^');
    console.error(processLines(line, endLine));
    console.error();
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
            var result;

            try {
                result = csso.minify(source, {
                    filename: inputFile || null,
                    restructure: !structureOptimisationOff,
                    debug: debug
                });
            } catch (e) {
                if (e.parseError) {
                    showParseError(source, inputFile, e.parseError, e.message);
                    process.exit(2);
                }

                throw e;
            }

            if (statistics) {
                var timeDiff = process.hrtime(time);
                showStat(
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
