'use strict';

require('shelljs/make');
var rootDir = __dirname + '/';      // absolute path to project's root

function makeShared() {
    cd(rootDir);
    cat('src/trbl.js').to('compressor.js');
    cat('src/compressor.shared.js').toEnd('compressor.js');
    cat('src/util.shared.js').to('util.js');
    cat('src/translator.shared.js').to('translator.js');
}

(function() {
    //
    // make shared
    //
    target.shared = function() {
        makeShared();
    };

    //
    // make node
    //
    target.node = function() {
        makeShared();
        cat('src/compressor.node.js').toEnd('compressor.js');
        mv('-f', 'compressor.js', 'lib/compressor.js');
        cat('src/util.node.js').toEnd('util.js');
        mv('-f', 'util.js', 'lib/util.js');
        cat('src/translator.node.js').toEnd('translator.js');
        mv('-f', 'translator.js', 'lib/translator.js');
    };

    //
    // make web
    //
    target.web = function() {
        makeShared();
        cat('util.js').to('web/csso.web.js');
        rm('-f', 'util.js');
        cat('src/gonzales.cssp.web.js').toEnd('web/csso.web.js');
        cat('src/compressor.web.js').toEnd('web/csso.web.js');
        cat('compressor.js').toEnd('web/csso.web.js');
        rm('-f', 'compressor.js');
        cat('translator.js').toEnd('web/csso.web.js');
        rm('-f', 'translator.js');
    };

    //
    // make all
    //
    target.all = function() {
        target.node();
        target.web();
    };

    //
    // make test
    //
    target.test = function() {
        exec('npm test');
    };

    //
    // make help
    //
    target.help = function() {
        echo('Available targets:');
        echo('  shared      builds the common code');
        echo('  node        builds the node.js code');
        echo('  web         builds the web version');
        echo('  test        runs the tests');
        echo('  help        shows this help message');
    };

}());
