[![NPM version](https://img.shields.io/npm/v/csso.svg)](https://www.npmjs.com/package/csso)
[![Build Status](https://travis-ci.org/css/csso.svg?branch=master)](https://travis-ci.org/css/csso)
[![Coverage Status](https://coveralls.io/repos/github/css/csso/badge.svg?branch=master)](https://coveralls.io/github/css/csso?branch=master)
[![Dependency Status](https://img.shields.io/david/css/csso.svg)](https://david-dm.org/css/csso)
[![devDependency Status](https://img.shields.io/david/dev/css/csso.svg)](https://david-dm.org/css/csso#info=devDependencies)
[![Twitter](https://img.shields.io/badge/Twitter-@cssoptimizer-blue.svg)](https://twitter.com/cssoptimizer)

CSSO (CSS Optimizer) is a CSS minimizer unlike others. In addition to usual minification techniques it can perform structural optimization of CSS files, resulting in smaller file size compared to other minifiers.

## Install

```
npm install -g csso
```

## Usage

### Runners

- Gulp: [gulp-csso](https://github.com/ben-eb/gulp-csso)
- Grunt: [grunt-csso](https://github.com/t32k/grunt-csso)
- Broccoli: [broccoli-csso](https://github.com/sindresorhus/broccoli-csso)

### Command line

```
csso [input] [output] [options]

Options:

      --debug [level]       Output intermediate state of CSS during compression
  -h, --help                Output usage information
  -i, --input <filename>    Input file
      --input-map <source>  Input source map. Possible values: none, auto (default) or <filename>
  -m, --map <destination>   Generate source map. Possible values: none (default), inline, file or <filename>
  -o, --output <filename>   Output file (result outputs to stdout if not set)
      --restructure-off     Turns structure minimization off
      --stat                Output statistics in stderr
  -v, --version             Output version
```

Some examples:

```
> csso in.css out.css

> csso in.css
...output result in stdout...

> echo '.test { color: #ff0000; }' | csso
.test{color:red}

> cat source1.css source2.css | csso | gzip -9 -c > production.css.gz

> echo '.test { color: #ff0000 }' | csso --stat >/dev/null
File:       <stdin>
Original:   25 bytes
Compressed: 16 bytes (64.00%)
Saving:     9 bytes (36.00%)
Time:       12 ms
Memory:     0.346 MB
```

### Source maps

Source map doesn't generate by default. To generate map use `--map` CLI option, that can be:

- `none` (default) – don't generate source map
- `inline` – generate map add it into result content (via `/*# sourceMappingURL=application/json;base64,...base64 encoded map... */`)
- `file` – generate map and write it into file with same name as output file, but with `.map` extension; in this case `--output` option is required
- any other values treat as filename for generated source map

Examples:

```
> csso my.css --map inline
> csso my.css --map file --output my.min.css
> csso my.css -o my.min.css -m maps/my.min.map
```

Input can has a source map. Use `--input-map` option to specify input source if needed. Possible values for option:

- `auto` (auto) - attempt to fetch input source map by follow steps:
  - try to fetch inline map from source
  - try to fetch map filename from source and read its content
  - (when `--input` is specified) check for file with same name as input but with `.map` extension exists and read its content
- `none` - don't use input source map; actually it's using to disable `auto`-fetching
- any other values as filename for input source map

> NOTE: Input source map is using only if source map is generating.

### API

```js
var csso = require('csso');

var compressedCss = csso.minify('.test { color: #ff0000; }');

console.log(compressedCss);
// .test{color:red}


// there are some options you can pass
var compressedWithOptions = csso.minify('.test { color: #ff0000; }', {
    restructure: false,   // don't change css structure, i.e. don't merge declarations, rulesets etc
    debug: true           // show additional debug information:
                          // true or number from 1 to 3 (greater number - more details)
});

// you may do it step by step
var ast = csso.parse('.test { color: #ff0000; }');
var compressedAst = csso.compress(ast);
var compressedCss = csso.translate(compressedAst, true);

console.log(compressedCss);
// .test{color:red}
```

Working with source maps:

```js
var css = fs.readFileSync('path/to/my.css', 'utf8');
var result = csso.minify(css, {
  filename: 'path/to/my.css', // will be added to source map as reference to file
  sourceMap: true             // generate source map
});

console.log(result);
// { css: '...minified...', map: SourceMapGenerator {} }

console.log(result.map.toString());
// '{ .. source map content .. }'

// apply input source map
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var inputSourceMap = fs.readFileSync('path/to/my.css.map', 'utf8');

result.map.applySourceMap(
  new SourceMapConsumer(inputSourceMap),
  'path/to/my.css'  // should be the same as passed to csso.minify()
);
```

### Debugging

```
> echo '.test { color: green; color: #ff0000 } .foo { color: red }' | csso --debug
## parsing done in 10 ms

Compress block #1
(0.002ms) convertToInternal
(0.000ms) clean
(0.001ms) compress
(0.002ms) prepare
(0.000ms) initialRejoinRuleset
(0.000ms) rejoinAtrule
(0.000ms) disjoin
(0.000ms) buildMaps
(0.000ms) markShorthands
(0.000ms) processShorthand
(0.001ms) restructBlock
(0.000ms) rejoinRuleset
(0.000ms) restructRuleset
## compressing done in 9 ms

.foo,.test{color:red}
```

More details are provided when `--debug` flag has a number greater than `1`:

```
> echo '.test { color: green; color: #ff0000 } .foo { color: red }' | csso --debug 2
## parsing done in 8 ms

Compress block #1
(0.000ms) clean
  .test{color:green;color:#ff0000}.foo{color:red}

(0.001ms) compress
  .test{color:green;color:red}.foo{color:red}

...

(0.002ms) restructBlock
  .test{color:red}.foo{color:red}

(0.001ms) rejoinRuleset
  .foo,.test{color:red}

## compressing done in 13 ms

.foo,.test{color:red}
```

Using `--debug` option adds stack trace to CSS parse error output. That can help to find out problem in parser.

```
> echo '.a { color }' | csso --debug

Parse error <stdin>: Colon is expected
    1 |.a { color }
------------------^
    2 |

/usr/local/lib/node_modules/csso/lib/cli.js:243
                throw e;
                ^

Error: Colon is expected
    at parseError (/usr/local/lib/node_modules/csso/lib/parser/index.js:54:17)
    at eat (/usr/local/lib/node_modules/csso/lib/parser/index.js:88:5)
    at getDeclaration (/usr/local/lib/node_modules/csso/lib/parser/index.js:394:5)
    at getBlock (/usr/local/lib/node_modules/csso/lib/parser/index.js:380:27)
    ...
```

## License

MIT
