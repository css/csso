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

var command = cli.create('csso', '[input] [output]')
    .version(require('../package.json').version)
    .option('-i, --input <filename>', 'Input file')
    .option('-o, --output <filename>', 'Output file (result outputs to stdout if not set)')
    .option('--restructure-off', 'Turns structure minimization off')
    .option('--debug', 'Output intermediate state of CSS during compression')
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

        readFromStream(input, function(source) {
            var result = csso.minify(source, {
                restructuring: !structureOptimisationOff,
                debug: debug
            });

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
