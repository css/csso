# 1. Introduction

CSSO (CSS Optimizer) is a CSS minimizer unlike others. In addition to usual minification techniques it can perform structural optimization of CSS files, resulting in smaller file size compared to other minifiers.

This document describes installation and usage of CSSO. If you want to learn more about the inner workings of CSSO, please consult the [manual] (https://github.com/afelix/csso/blob/master/MANUAL.ru.md).

Please report issues on [Github] (https://github.com/afelix/csso/issues).

For feedback, suggestions, etc. write to <skryzhanovsky@ya.ru>.

**Important**: this project is in beta and may contain bugs. Current version: 1.1.2

**Important**: indeed, it does contain bugs which break the resulting CSS. You've been warned.

# 2. Installation

## 2.1. Prerequisites

* for browser use: any OS and a modern web browser
* for command line use: Linux / Mac OS X

## 2.2. Install using git

Prerequisites:

* git&nbsp;— [http://git-scm.com/](http://git-scm.com/)

To install:

* run `git clone git://github.com/afelix/csso.git`

## 2.3. Install using npm

Prerequisites:

* nodejs 0.4.x&nbsp;— [http://nodejs.org](http://nodejs.org)
* npm&nbsp;— [http://github.com/isaacs/npm/](http://github.com/isaacs/npm/)

To install:

* run `npm install csso`

# 3. Usage

## 3.1. From the browser

Open `web/csso.html` in your browser.

## 3.2. From the command line

Run `bin/csso` (when installed from git), you will need to have nodejs 0.4.x installed&nbsp;— [http://nodejs.org](http://nodejs.org)

Run `csso` (when installed from npm).

Usage:

    csso
        shows usage information
    csso <filename>
        minimizes the CSS in <filename> and outputs the result to stdout
    csso -r <filename>
    csso --restructure <filename>
        enable structural optimization
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
* Removal of invalid elements
* Minification of color properties
* Minification of `0`
* Minification of `margin` and `padding` properties
* Minification of multi-line strings
* Minification of the `font-weight` property

Structural optimizations:

* Merging blocks with identical selectors
* Merging blocks with identical properties
* Removal of overridden properties
* Removal of repeating selectors
* Partial merging of blocks
* Partial splitting of blocks

The minification techniques are described in detail in the [manual](https://github.com/afelix/csso/blob/master/MANUAL.ru.md).

# 5. Note to developers

CSSO is written in easy-to-understand JavaScript. It's easily portable to other languages, such as Python, Java, PHP, Perl, C++, C, etc. The source code is licensed under [MIT](https://github.com/afelix/csso/blob/master/MIT-LICENSE.txt).

# 6. Authors

* initial idea&nbsp;— Vitaly Harisov (<vitaly@harisov.name>)
* implementation&nbsp;— Sergey Kryzhanovsky (<skryzhanovsky@ya.ru>)

# 7. And finally

* [TODO items](https://github.com/afelix/csso/blob/master/TODO.md)
* CSSO is licensed under [MIT](https://github.com/afelix/csso/blob/master/MIT-LICENSE.txt)
