[![NPM version](https://img.shields.io/npm/v/csso.svg)](https://www.npmjs.com/package/csso)
[![Build Status](https://travis-ci.org/css/csso.svg?branch=master)](https://travis-ci.org/css/csso)
[![Coverage Status](https://coveralls.io/repos/github/css/csso/badge.svg?branch=master)](https://coveralls.io/github/css/csso?branch=master)
[![NPM Downloads](https://img.shields.io/npm/dm/csso.svg)](https://www.npmjs.com/package/csso)
[![Twitter](https://img.shields.io/badge/Twitter-@cssoptimizer-blue.svg)](https://twitter.com/cssoptimizer)

CSSO (CSS Optimizer) is a CSS minifier. It performs three sort of transformations: cleaning (removing redundant), compression (replacement for shorter form) and restructuring (merge of declarations, rulesets and so on). As a result your CSS becomes much smaller.

[![Originated by Yandex](https://cdn.rawgit.com/css/csso/8d1b89211ac425909f735e7d5df87ee16c2feec6/docs/yandex.svg)](https://www.yandex.com/)
[![Sponsored by Avito](https://cdn.rawgit.com/css/csso/8d1b89211ac425909f735e7d5df87ee16c2feec6/docs/avito.svg)](https://www.avito.ru/)

## Ready to use

- [Web interface](http://css.github.io/csso/csso.html)
- CLI: [csso-cli](https://github.com/css/csso-cli)
- Gulp: [gulp-csso](https://github.com/ben-eb/gulp-csso)
- Grunt: [grunt-csso](https://github.com/t32k/grunt-csso)
- Broccoli: [broccoli-csso](https://github.com/sindresorhus/broccoli-csso)
- PostCSS: [postcss-csso](https://github.com/lahmatiy/postcss-csso)
- Webpack: [csso-loader](https://github.com/sandark7/csso-loader)

## Install

```
npm install csso
```

## API

<!-- MarkdownTOC -->

- [minify\(source\[, options\]\)](#minifysource-options)
- [minifyBlock\(source\[, options\]\)](#minifyblocksource-options)
- [compress\(ast\[, options\]\)](#compressast-options)
- [Source maps](#source-maps)
- [Usage data](#usage-data)
  - [Selector filtering](#selector-filtering)
  - [Scopes](#scopes)
- [Debugging](#debugging)

<!-- /MarkdownTOC -->

Basic usage:

```js
var csso = require('csso');

var minifiedCss = csso.minify('.test { color: #ff0000; }').css;

console.log(minifiedCss);
// .test{color:red}
```

CSSO is based on [CSSTree](https://github.com/csstree/csstree) to parse CSS into AST, AST traversal and to generate AST back to CSS. All `CSSTree` API is available behind `syntax` field. You may minify CSS step by step:

```js
var csso = require('csso');
var ast = csso.syntax.parse('.test { color: #ff0000; }');
var compressedAst = csso.compress(ast).ast;
var minifiedCss = csso.syntax.translate(compressedAst);

console.log(minifiedCss);
// .test{color:red}
```

> Warning: CSSO uses early versions of CSSTree that still in active development. CSSO doesn't guarantee API behind `syntax` field or AST format will not change in future releases of CSSO, since it's subject to change in CSSTree. Be carefull with CSSO updates if you use `syntax` API until this warning removal.

### minify(source[, options])

Minify `source` CSS passed as `String`.

```js
var result = csso.minify('.test { color: #ff0000; }', {
    restructure: false,   // don't change CSS structure, i.e. don't merge declarations, rulesets etc
    debug: true           // show additional debug information:
                          // true or number from 1 to 3 (greater number - more details)
});

console.log(result.css);
// > .test{color:red}
```

Returns an object with properties:

- css `String` – resulting CSS
- map `Object` – instance of [`SourceMapGenerator`](https://github.com/mozilla/source-map#sourcemapgenerator) or `null`

Options:

- sourceMap

  Type: `Boolean`  
  Default: `false`

  Generate a source map when `true`.

- filename

  Type: `String`  
  Default: `'<unknown>'`

  Filename of input CSS, uses for source map generation.

- debug

  Type: `Boolean`  
  Default: `false`

  Output debug information to `stderr`.

- beforeCompress

  Type: `function(ast, options)` or `Array<function(ast, options)>` or `null`  
  Default: `null`

  Called right after parse is run.

- afterCompress

  Type: `function(compressResult, options)` or `Array<function(compressResult, options)>` or `null`  
  Default: `null`

  Called right after [`compress()`](#compressast-options) is run.

- Other options are the same as for [`compress()`](#compressast-options) function.

### minifyBlock(source[, options])

The same as `minify()` but for list of declarations. Usually it's a `style` attribute value.

```js
var result = csso.minifyBlock('color: rgba(255, 0, 0, 1); color: #ff0000');

console.log(result.css);
// > color:red
```

### compress(ast[, options])

Does the main task – compress an AST.

> NOTE: `compress()` performs AST compression by transforming input AST by default (since AST cloning is expensive and needed in rare cases). Use `clone` option with truthy value in case you want to keep input AST untouched.

Returns an object with properties:

- ast `Object` – resulting AST

Options:

- restructure

  Type: `Boolean`  
  Default: `true`

  Disable or enable a structure optimisations.

- clone

  Type: `Boolean`  
  Default: `false`

  Transform a copy of input AST if `true`. Useful in case of AST reuse.

- comments

  Type: `String` or `Boolean`  
  Default: `true`

  Specify what comments to left:

  - `'exclamation'` or `true` – left all exclamation comments (i.e. `/*! .. */`)
  - `'first-exclamation'` – remove every comments except first one
  - `false` – remove every comments

- usage

  Type: `Object` or `null`  
  Default: `null`

  Usage data for advanced optimisations (see [Usage data](#usage-data) for details)

- logger

  Type: `Function` or `null`  
  Default: `null`

  Function to track every step of transformation.

### Source maps

To get a source map set `true` for `sourceMap` option. Additianaly `filename` option can be passed to specify source file. When `sourceMap` option is `true`, `map` field of result object will contain a [`SourceMapGenerator`](https://github.com/mozilla/source-map#sourcemapgenerator) instance. This object can be mixed with another source map or translated to string.

```js
var csso = require('csso');
var css = fs.readFileSync('path/to/my.css', 'utf8');
var result = csso.minify(css, {
  filename: 'path/to/my.css', // will be added to source map as reference to source file
  sourceMap: true             // generate source map
});

console.log(result);
// { css: '...minified...', map: SourceMapGenerator {} }

console.log(result.map.toString());
// '{ .. source map content .. }'
```

Example of generating source map with respect of source map from input CSS:

```js
var require('source-map');
var csso = require('csso');
var inputFile = 'path/to/my.css';
var input = fs.readFileSync(inputFile, 'utf8');
var inputMap = input.match(/\/\*# sourceMappingURL=(\S+)\s*\*\/\s*$/);
var output = csso.minify(input, {
  filename: inputFile,
  sourceMap: true
});

// apply input source map to output
if (inputMap) {
  output.map.applySourceMap(
    new SourceMapConsumer(inputMap[1]),
    inputFile
  )
}

// result CSS with source map
console.log(
  output.css +
  '/*# sourceMappingURL=data:application/json;base64,' +
  new Buffer(output.map.toString()).toString('base64') +
  ' */'
);
```

### Usage data

`CSSO` can use data about how `CSS` is using for better compression. File with this data (`JSON` format) can be set using `usage` option. Usage data may contain follow sections:

- `tags` – white list of tags
- `ids` – white list of ids
- `classes` – white list of classes
- `scopes` – groups of classes which never used with classes from other groups on single element

All sections are optional. Value of `tags`, `ids` and `classes` should be array of strings, value of `scopes` should be an array of arrays of strings. Other values are ignoring.

#### Selector filtering

`tags`, `ids` and `classes` are using on clean stage to filter selectors that contains something that not in list. Selectors are filtering only by those kind of simple selector which white list is specified. For example, if only `tags` list is specified then type selectors are checking, and if selector hasn't any type selector (or even any type selector) it isn't filter.

> `ids` and `classes` names are case sensitive, `tags` – is not.

Input CSS:

```css
* { color: green; }
ul, ol, li { color: blue; }
UL.foo, span.bar { color: red; }
```

Usage data:

```json
{
    "tags": ["ul", "LI"]
}
```

Result CSS:

```css
*{color:green}ul,li{color:blue}ul.foo{color:red}
```

#### Scopes

Scopes is designed for CSS scope isolation solutions such as [css-modules](https://github.com/css-modules/css-modules). Scopes are similar to namespaces and defines lists of class names that exclusively used on some markup. This information allows the optimizer to move rulesets more agressive. Since it assumes selectors from different scopes can't to be matched on the same element. That leads to better ruleset merging.

Suppose we have a file:

```css
.module1-foo { color: red; }
.module1-bar { font-size: 1.5em; background: yellow; }

.module2-baz { color: red; }
.module2-qux { font-size: 1.5em; background: yellow; width: 50px; }
```

It can be assumed that first two rules are never used with the second two on the same markup. But we can't know that for sure without markup. The optimizer doesn't know it either and will perform safe transformations only. The result will be the same as input but with no spaces and some semicolons:

```css
.module1-foo{color:red}.module1-bar{font-size:1.5em;background:#ff0}.module2-baz{color:red}.module2-qux{font-size:1.5em;background:#ff0;width:50px}
```

But with usage data `CSSO` can get better output. If follow usage data is provided:

```json
{
    "scopes": [
        ["module1-foo", "module1-bar"],
        ["module2-baz", "module2-qux"]
    ]
}
```

New result (29 bytes extra saving):

```css
.module1-foo,.module2-baz{color:red}.module1-bar,.module2-qux{font-size:1.5em;background:#ff0}.module2-qux{width:50px}
```

If class name doesn't specified in `scopes` it belongs to default "scope". `scopes` doesn't affect `classes`. If class name presents in `scopes` but missed in `classes` (both sections specified) it will be filtered.

Note that class name can't be specified in several scopes. Also selector can't has classes from different scopes. In both cases an exception throws.

Currently the optimizer doesn't care about out-of-bounds selectors order changing safety (i.e. selectors that may be matched to elements with no class name of scope, e.g. `.scope div` or `.scope ~ :last-child`) since assumes scoped CSS modules doesn't relay on it's order. It may be fix in future if to be an issue.

### Debugging

> TODO
