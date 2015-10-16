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

      --debug              Output intermediate state of CSS during compression
  -h, --help               Output usage information
  -i, --input <filename>   Input file
  -o, --output <filename>  Output file (result outputs to stdout if not set)
      --restructure-off    Turns structure minimization off
  -v, --version            Output the version
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

### API

```js
var csso = require('csso');

var compressed = csso.minify('.test { color: #ff0000; }');
console.log(compressed);
// .test{color:red}

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
