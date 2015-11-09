## 1.4.2 (November 9, 2015)

- allow spaces between `progid:` and rest part of value for IE's `filter` property as `autoprefixer` generates this kind of code (#249)
- fixes for Windows:
  - correct processing new lines
  - normalize file content in test suite
- fixes to work in strict mode (#252)
- init compressor dictionaries for every css block (#248, #251)
- bump uglify-js version

## 1.4.1 (October 20, 2015)

- allow merge for `display` property (#167, #244)
- more accurate `rect` (`clip` property value) merge
- fix typo when specifying options in cli (thanks to @Taritsyn)
- fix safe unit values merge with keyword values (#244)
- fix wrong descendant combinator removal (#246)
- build browser version on `prepublish` (thanks to @silentroach)
- parser: store whitespaces as single token (performance and reduce memory consumption)
- rearrange compress tests layout

## 1.4 (October 16, 2015)

Bringing project back to life. Changed files structure, cleaned up and refactored most of sources.

### Common

- single code base (no more `src` folder)
- build browser version with `browserify` (no more `make`, and `web` folder), browser version is available at `dist/csso-browser.js`
- main file is `lib/index.js` now
- minimal `node.js` version is `0.12` now
- restrict file list to publish on npm (no more useless folders and files in package)
- add `jscs` to control code style
- automate `gh-pages` update
- util functions reworked
- translator reworked
- test suite reworked
- compressor refactored
- initial parser refactoring

### API

- new method `minify(src, options)`, options:
  - `restructuring` – if set to `false`, disable structure optimisations (`true` by default)
  - `debug` - outputs intermediate state of CSS during compression (`false` by default)
- deprecate `justDoIt()` method (use `minify` instead)
- rename `treeToString()` method to `stringify()`
- drop `printTree()` method
- AST node info
  - `column` and `offset` added
  - `ln` renamed to `line`
  - fix line counting across multiple files and input with CR LF (#147)

### CLI

- completely reworked, use [clap](https://github.com/lahmatiy/clap) to parse argv
- add support for input from stdin (#128)
- drop undocumented and obsoleted options `--rule` and `--parser` (suppose nobody use it)
- drop `-off` alias for `--restructure-off` as incorrect (only one letter options should starts with single `-`)
- new option `--debug` that reflecting to `options.debug` for `minify`

### Parsing and optimizations

- keep all exclamation comments (#194)
- add `/deep/` combinator support (#209)
- attribute selector
  - allow colon in attribute name (#237)
  - support for namespaces (#233)
- color
  - support all css/html colors
  - convert `hsla` to `rgba` and `hls` to `rgb`
  - convert `rgba` with 1 as alpha value to `rgb` (#122)
  - interpolate `rgb` and `rgba` percentage values to absolute values
  - replace percentage values in `rgba` for normalized/interpolated values
  - lowercase hex colors and color names (#169)
  - fix color minification when hex value replaced for color name (#176)
  - fit rgb values to 0..255 range (#181)
- calc
  - remove spaces for multiple operator in calc
  - don't remove units inside calc (#222)
  - fix wrong white space removal around `+` and `-` (#228)
- don't remove units in `flex` property as it could change value meaning (#200)
- don't merge `\9` hack values (#231)
- merge property values only if they have the same functions (#150, #227)
- don't merge property values with some sort of units (#140, #161)
- fix `!important` issue for `top-right-bottom-left` properties (#189)
- fix `top-right-bottom-left` properties merge (#139, #175)
- support for unicode-range (#148)
- don't crash on ruleset with no selector (#135)
- tolerant to class names that starts with digit (#99, #105)
- fix background compressing (#170)

## 1.3.12 (October 8, 2015)

- Case insensitive check for `!important` (issue #187)
- Fix problems with using `csso` as cli command on Windows (issue #83, #136, #142 and others)
- Remove byte order marker (the UTF-8 BOM) from input
- Don't strip space between funktion-funktion and funktion-vhash (issue #134)
- Don't merge TRBL values having \9 (hack for IE8 in bootstrap) (issues #159, #214, #230, #231 and others)
- Don't strip units off dimensions of non-length (issues #226, #229 and others)

## 1.3.7 (February 11, 2013)

- Gonzales 1.0.7.

## 1.3.6 (November 26, 2012)

- Gonzales 1.0.6.

## 1.3.5 (October 28, 2012)

- Gonzales 1.0.5.
- Protecting copyright notices in CSS: https://github.com/css/csso/issues/92
- Zero CSS throws an error: https://github.com/css/csso/issues/96
- Don't minify the second `0s` in Firefox for animations: https://github.com/css/csso/issues/100
- Japan manual
- BEM ready documentation

## 1.3.4 (October 10, 2012)

- @page inside @media Causes Error: https://github.com/css/csso/issues/90

## 1.3.3 (October 9, 2012)

- CSSO 1.3.2 compresses ".t-1" and ".t-01" as identical classes: https://github.com/css/csso/issues/88

## 1.3.2 (October 8, 2012)

- filter + important breaks CSSO v1.3.1: https://github.com/css/csso/issues/87

## 1.3.1 (October 8, 2012)

- "filter" IE property breaks CSSO v1.3.0: https://github.com/css/csso/issues/86

## 1.3.0 (October 4, 2012)

- PeCode CSS parser replaced by Gonzales CSS parser
