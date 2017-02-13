[![NPM version](https://img.shields.io/npm/v/csso.svg)](https://www.npmjs.com/package/csso)
[![Build Status](https://travis-ci.org/css/csso.svg?branch=master)](https://travis-ci.org/css/csso)
[![Coverage Status](https://coveralls.io/repos/github/css/csso/badge.svg?branch=master)](https://coveralls.io/github/css/csso?branch=master)
[![NPM Downloads](https://img.shields.io/npm/dm/csso.svg)](https://www.npmjs.com/package/csso)
[![Twitter](https://img.shields.io/badge/Twitter-@cssoptimizer-blue.svg)](https://twitter.com/cssoptimizer)

CSSO (CSS Optimizer) is a CSS minifier. It performs three sort of transformations: cleaning (removing redundant), compression (replacement for shorter form) and restructuring (merge of declarations, rulesets and so on). As a result your CSS becomes much smaller.

[![Originated by Yandex](https://cdn.rawgit.com/css/csso/8d1b89211ac425909f735e7d5df87ee16c2feec6/docs/yandex.svg)](https://www.yandex.com/)
[![Sponsored by Avito](https://cdn.rawgit.com/css/csso/8d1b89211ac425909f735e7d5df87ee16c2feec6/docs/avito.svg)](https://www.avito.ru/)

<!-- MarkdownTOC -->

- [Ready to use](#ready-to-use)
- [Install](#install)
- [API](#api)
  - [minify\(source\[, options\]\)](#minifysource-options)
  - [minifyBlock\(source\[, options\]\)](#minifyblocksource-options)
  - [compress\(ast\[, options\]\)](#compressast-options)
  - [Source maps](#source-maps)
  - [Usage data](#usage-data)
    - [Selector filtering](#selector-filtering)
    - [Scopes](#scopes)
  - [Debugging](#debugging)
- [License](#license)

<!-- /MarkdownTOC -->

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
npm install -g csso
```

## API

```js
var csso = require('csso');

var compressedCss = csso.minify('.test { color: #ff0000; }').css;

console.log(compressedCss);
// .test{color:red}
```

You may minify CSS by yourself step by step:

```js
var ast = csso.parse('.test { color: #ff0000; }');
var compressResult = csso.compress(ast);
var compressedCss = csso.translate(compressResult.ast);

console.log(compressedCss);
// .test{color:red}
```

Working with source maps:

```js
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

### minify(source[, options])

Minify `source` CSS passed as `String`.

Options:

- sourceMap `Boolean` - generate source map if `true`
- filename `String` - filename of input, uses for source map
- debug `Boolean` - output debug information to `stderr`
- beforeCompress `function|array<function>` - called right after parse is run. Callbacks arguments are `ast, options`.
- afterCompress `function|array<function>` - called right after compress is run. Callbacks arguments are `compressResult, options`.
- other options are the same as for `compress()`

Returns an object with properties:

- css `String` – resulting CSS
- map `Object` – instance of `SourceMapGenerator` or `null`

```js
var result = csso.minify('.test { color: #ff0000; }', {
    restructure: false,   // don't change CSS structure, i.e. don't merge declarations, rulesets etc
    debug: true           // show additional debug information:
                          // true or number from 1 to 3 (greater number - more details)
});

console.log(result.css);
// > .test{color:red}
```

### minifyBlock(source[, options])

The same as `minify()` but for style block. Usually it's a `style` attribute content.

```js
var result = csso.minifyBlock('color: rgba(255, 0, 0, 1); color: #ff0000').css;

console.log(result.css);
// > color:red
```

### compress(ast[, options])

Does the main task – compress AST.

> NOTE: `compress` performs AST compression by transforming input AST by default (since AST cloning is expensive and needed in rare cases). Use `clone` option with truthy value in case you want to keep input AST untouched.

Options:

- restructure `Boolean` – do the structure optimisations or not (`true` by default)
- clone `Boolean` - transform a copy of input AST if `true`, useful in case of AST reuse (`false` by default)
- comments `String` or `Boolean` – specify what comments to left
    - `'exclamation'` or `true` (default) – left all exclamation comments (i.e. `/*! .. */`)
    - `'first-exclamation'` – remove every comments except first one
    - `false` – remove every comments
- usage `Object` - usage data for advanced optimisations (see [Usage data](#usage-data) for details)
- logger `Function` - function to track every step of transformations

### Source maps

> TODO

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

## License

MIT
