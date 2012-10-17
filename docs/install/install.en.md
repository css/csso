# 1. Introduction

CSSO (CSS Optimizer) is a CSS minimizer unlike others. In addition to usual minification techniques it can perform structural optimization of CSS files, resulting in smaller file size compared to other minifiers.

This document describes installation and usage of CSSO. If you want to learn more about the inner workings of CSSO, please consult the [manual] (https://github.com/css/csso/blob/master/MANUAL.en.md).

Please report issues on [Github] (https://github.com/css/csso/issues).

For feedback, suggestions, etc. write to <skryzhanovsky@ya.ru>.

# 2. Installation

## 2.1. Prerequisites

* for browser use: any OS and a modern web browser
* for command line use: Linux / Mac OS X / any OS with working Node.js

## 2.2. Install using git

Prerequisites:

* git&nbsp;— [http://git-scm.com/](http://git-scm.com/)

To install:

* run `git clone git://github.com/css/csso.git`

## 2.3. Install using npm

Prerequisites:

* nodejs 0.4.x&nbsp;— [http://nodejs.org](http://nodejs.org)
* npm&nbsp;— [http://github.com/isaacs/npm/](http://github.com/isaacs/npm/)

To install (global):

* run `npm install csso -g`

To update:

* run `npm update csso`

To uninstall:

* run `npm uninstall csso`

# 3. Usage

## 3.1. In the browser

Open `web/csso.html` or [http://css.github.com/csso/csso.html](http://css.github.com/csso/csso.html) in your browser.

**CSSO is not guaranteed to work in browsers. Preferred way to use this tool is to run it from the command line or via npm modules.**

## 3.2. As an npm module

Sample (`test.js`):

    var csso = require('csso'),
        css = '.test, .test { color: rgb(255, 255, 255) }';

    console.log(csso.justDoIt(css));
Output (`> node test.js`):

    .test{color:#fff}
Use `csso.justDoIt(css, true)` to turn structure minimization off.

## 3.3. From the command line

Run `bin/csso` (when installed from git), you will need to have nodejs 0.4.x installed&nbsp;— [http://nodejs.org](http://nodejs.org)

Run `csso` (when installed from npm).

Usage:

    csso
        shows usage information
    csso <filename>
        minimizes the CSS in <filename> and outputs the result to stdout
    csso <in_filename> <out_filename>
    csso -i <in_filename> -o <out_filename>
    csso --input <in_filename> --output <out_filename>
        minimizes the CSS in <in_filename> and outputs the result to <out_filename>
    csso -off
    csso --restructure-off
        turns structure minimization off
    csso -h
    csso --help
        shows usage information
    csso -v
    csso --version
        shows the version number

Example:

    $ echo ".test { color: red; color: green }" > test.css
    $ csso test.css
    .test{color:green}

# 4. Minification (in a nutshell)

Safe transformations:

* Removal of whitespace
* Removal of trailing `;`
* Removal of comments
* Removal of invalid `@charset` и `@import` declarations
* Minification of color properties
* Minification of `0`
* Minification of multi-line strings
* Minification of the `font-weight` property

Structural optimizations:

* Merging blocks with identical selectors
* Merging blocks with identical properties
* Removal of overridden properties
* Removal of overridden shorthand properties
* Removal of repeating selectors
* Partial merging of blocks
* Partial splitting of blocks
* Removal of empty ruleset and at-rule
* Minification of `margin` and `padding` properties

The minification techniques are described in detail in the [manual](https://github.com/css/csso/blob/master/MANUAL.en.md).

# 5. Authors

* initial idea&nbsp;— Vitaly Harisov (<vitaly@harisov.name>)
* implementation&nbsp;— Sergey Kryzhanovsky (<skryzhanovsky@ya.ru>)
* english translation&nbsp;— Leonid Khachaturov (leonidkhachaturov@gmail.com)

# 6. And finally

* CSSO is licensed under [MIT](https://github.com/css/csso/blob/master/MIT-LICENSE.txt)

<!-- Yandex.Metrika counter -->
<img src="//mc.yandex.ru/watch/12831025" style="position:absolute; left:-9999px;" alt="" />
<!-- /Yandex.Metrika counter -->
