[![NPM version](https://img.shields.io/npm/v/csso.svg)](https://www.npmjs.com/package/csso)
[![Build Status](https://travis-ci.org/css/csso.svg?branch=master)](https://travis-ci.org/css/csso)
[![Coverage Status](https://coveralls.io/repos/github/css/csso/badge.svg?branch=master)](https://coveralls.io/github/css/csso?branch=master)
[![NPM Downloads](https://img.shields.io/npm/dm/csso.svg)](https://www.npmjs.com/package/csso)
[![Twitter](https://img.shields.io/badge/Twitter-@cssoptimizer-blue.svg)](https://twitter.com/cssoptimizer)

CSSO (CSS Optimizer) is a CSS minifier. It performs three sort of transformations: cleaning (removing redundant), compression (replacement for shorter form) and restructuring (merge of declarations, rulesets and so on). As a result your CSS becomes much smaller.

[![Originated by Yandex](https://cdn.rawgit.com/css/csso/8d1b89211ac425909f735e7d5df87ee16c2feec6/docs/yandex.svg)](https://www.yandex.com/)
[![Sponsored by Avito](https://cdn.rawgit.com/css/csso/8d1b89211ac425909f735e7d5df87ee16c2feec6/docs/avito.svg)](https://www.avito.ru/)

## Usage

```
npm install -g csso
```

Or try out CSSO [right in your browser](http://css.github.io/csso/csso.html) (web interface).

### Runners

- Gulp: [gulp-csso](https://github.com/ben-eb/gulp-csso)
- Grunt: [grunt-csso](https://github.com/t32k/grunt-csso)
- Broccoli: [broccoli-csso](https://github.com/sindresorhus/broccoli-csso)
- PostCSS: [postcss-csso](https://github.com/lahmatiy/postcss-csso)

### Command line

```
csso [input] [output] [options]

Options:

      --debug [level]       Output intermediate state of CSS during compression
  -h, --help                Output usage information
  -i, --input <filename>    Input file
      --input-map <source>  Input source map: none, auto (default) or <filename>
  -m, --map <destination>   Generate source map: none (default), inline, file or <filename>
  -o, --output <filename>   Output file (result outputs to stdout if not set)
      --restructure-off     Turns structure minimization off
      --stat                Output statistics in stderr
  -u, --usage <filenane>    Usage data file
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
- `inline` – add source map into result CSS (via `/*# sourceMappingURL=application/json;base64,... */`)
- `file` – write source map into file with same name as output file, but with `.map` extension (in this case `--output` option is required)
- any other values treat as filename for generated source map

Examples:

```
> csso my.css --map inline
> csso my.css --output my.min.css --map file
> csso my.css --output my.min.css --map maps/my.min.map
```

Use `--input-map` option to specify input source map if needed. Possible values for option:

- `auto` (default) - attempt to fetch input source map by follow steps:
  - try to fetch inline map from input
  - try to fetch source map filename from input and read its content
  - (when `--input` is specified) check file with same name as input file but with `.map` extension exists and read its content
- `none` - don't use input source map; actually it's using to disable `auto`-fetching
- any other values treat as filename for input source map

Generally you shouldn't care about input source map since defaults behaviour (`auto`) covers most use cases.

> NOTE: Input source map is using only if output source map is generating.

### Usage data

`CSSO` can use data about how `CSS` is using for better compression. File with this data (`JSON` format) can be set using `--usage` option. Usage data may contain follow sections:

- `tags` – white list of tags
- `ids` – white list of ids
- `classes` – white list of classes
- `scopes` – groups of classes which never used with classes from other groups on single element

All sections are optional. Value of `tags`, `ids` and `classes` should be array of strings, value of `scopes` should be an array of arrays of strings. Other values are ignoring.

#### Selector filtering

`tags`, `ids` and `classes` are using on clean stage to filter selectors that contains something that not in list. Selectors are filtering only by those kind of simple selector which white list is specified. For example, if only `tags` list is specified then type selectors are checking, and if selector hasn't any type selector (or even any type selector) it isn't filter.

> `ids` and `classes` comparison is case sensetive, `tags` – is not.

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

It can be assumed that first two rules never used with second two on the same markup. But we can't know that for sure without markup. The optimizer doesn't know it eather and will perform safe transformations only. The result will be the same as input but with no spaces and some semicolons:

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
```

You may minify CSS by yourself step by step:

```js
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
  filename: 'path/to/my.css', // will be added to source map as reference to source file
  sourceMap: true             // generate source map
});

console.log(result);
// { css: '...minified...', map: SourceMapGenerator {} }

console.log(result.map.toString());
// '{ .. source map content .. }'
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
