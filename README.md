[![NPM version](https://img.shields.io/npm/v/csso.svg)](https://www.npmjs.com/package/csso)
[![Build Status](https://travis-ci.org/css/csso.svg?branch=master)](https://travis-ci.org/css/csso)
[![Dependency Status](https://img.shields.io/david/css/csso.svg)](https://david-dm.org/css/csso)
[![devDependency Status](https://img.shields.io/david/dev/css/csso.svg?style=flat)](https://david-dm.org/css/csso#info=devDependencies)

CSSO (CSS Optimizer) is a CSS minimizer unlike others. In addition to usual minification techniques it can perform structural optimization of CSS files, resulting in smaller file size compared to other minifiers.

## Install

```
npm install -g csso
```

## Usage

### Command line

```
csso [input] [output] [options]

Options:

      --debug [level]      Output intermediate state of CSS during compression
  -h, --help               Output usage information
  -i, --input <filename>   Input file
  -o, --output <filename>  Output file (result outputs to stdout if not set)
      --restructure-off    Turns structure minimization off
      --stat               Output statistics in stderr
  -v, --version            Output version
```

Some examples:

```
> csso in.css out.css

> csso in.css
...output result in stdout...

> echo ".test { color: #ff0000; }" | csso
.test{color:red}

> cat source1.css source2.css | csso | gzip -9 -c > production.css.gz
```

Debug and statistics:

```
> echo '.test { color: #ff0000 }' | node bin/csso --stat >/dev/null
File:       <stdin>
Original:   25 bytes
Compressed: 16 bytes (64.00%)
Saving:     9 bytes (36.00%)
Time:       12 ms
Memory:     0.346 MB
```

```
> echo '.test { color: green; color: #ff0000 } .foo { color: red }' | node bin/csso --debug
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

```
> echo '.test { color: green; color: #ff0000 } .foo { color: red }' | node bin/csso --debug 2
## parsing done in 8 ms

Compress block #1
(0.002ms) convertToInternal
  .test{color:green;color:#ff0000}.foo{color:red}

(0.000ms) clean
  .test{color:green;color:#ff0000}.foo{color:red}

(0.001ms) compress
  .test{color:green;color:red}.foo{color:red}

...

(0.002ms) restructBlock
  .test{color:red}.foo{color:red}

(0.001ms) rejoinRuleset
  .foo,.test{color:red}

(0.000ms) restructRuleset
  .foo,.test{color:red}

## compressing done in 13 ms

.foo,.test{color:red}
```

### API

```js
var csso = require('csso');

var compressed = csso.minify('.test { color: #ff0000; }');
console.log(compressed);
// .test{color:red}

// there are some options you can pass
var compressedWithOptions = csso.minify('.test { color: #ff0000; }', {
    restructuring: false, // don't change css structure, i.e. don't merge declarations, rulesets etc
    debug: true           // show additional debug information:
                          // true or number from 1 to 3 (greater number - more details)
});

// you may do it step by step
var ast = csso.parse('.test { color: #ff0000; }');
ast = csso.compress(ast);
var compressed = csso.translate(ast, true);
console.log(compressed);
// .test{color:red}
```

## Documentation

> May be outdated

- [English](https://github.com/css/csso/blob/master/docs/index/index.en.md)
- [Русский](https://github.com/css/csso/blob/master/docs/index/index.ru.md)
- [日本語](https://github.com/css/csso/blob/master/docs/index/index.ja.md)
- [한국어](https://github.com/css/csso/blob/master/docs/index/index.ko.md)
