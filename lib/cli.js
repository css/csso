var fs = require('fs');
var cli = require('clap');
var csso = require('./index.js');

var command = cli.create('csso', '[input] [output]')
  .version(require('../package.json').version)
  .option('-i, --input <filename>', 'Input file')
  .option('-o, --output <filename>', 'Output file (result outputs to stdout if not set)')
  .option('--restructure-off', 'Turns structure minimization off')
  .action(function(args) {
    var inputFile = this.values.input || args[0];
    var outputFile = this.values.output || args[1];

    if (!inputFile && !outputFile) {
      this.showHelp();
      return;
    }

    var content = fs.readFileSync(inputFile).toString().trim();
    var structureOptimisationOff = this.values.restructureOff;

    if (outputFile) {
      fs.writeFileSync(
        outputFile,
        csso.justDoIt(content, structureOptimisationOff, true),
        'utf-8'
      );
    } else {
      console.log(csso.justDoIt(content, structureOptimisationOff, true));
    }
  });

module.exports = {
  run: command.run.bind(command),
  isCliError: function(err){
    return err instanceof cli.Error;
  }
};
