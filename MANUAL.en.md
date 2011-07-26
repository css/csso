# Table of contents

* 1\. Introduction
* 2\. Minification
* 2.1\. Safe transformations
* 2.1.1\. Removal of whitespace
* 2.1.2\. Removal of trailing ';'
* 2.1.3\. Removal of comments
* 2.1.4\. Removal of invalid @charset and @import declarations
* 2.1.5\. Removal of invalid elements
* 2.1.6\. Minification of color properties
* 2.1.7\. Minification of 0
* 2.1.8\. Minification of margin and padding properties
* 2.1.9\. Minification of multi-line strings
* 2.1.10\. Minification of the font-weight property
* 2.2\. Structural optimization
* 2.2.1\. Merging blocks with identical selectors
* 2.2.2\. Merging blocks with idential properties
* 2.2.3\. Removal of overridden properties
* 2.2.4\. Removal of repeating selectors
* 2.2.5\. Partial merging of blocks
* 2.2.6\. Partial splitting of blocks
* 2.3\. Managing structural optimizations
* 2.3.1\. Guarding against deletion
* 2.3.2\. Guarding against re-ordering
* 2.3.3\. Combining guards
* 3\. Recommendations
* 3.1\. Length of selectors
* 3.2\. Order of properties
* 3.3\. Positioning of similar blocks
* 3.4\. Using !important

# 1. Introduction

CSSO (CSS Optimizer) is a CSS minimizer unlike others. In addition to usual minification techniques it can perform structural optimization of CSS files, resulting in smaller file size compared to other minifiers.

This document describes the minification techniques we employ. If you are looking for an installation and usage guide, you can find it [here](https://github.com/afelix/csso/blob/master/README.md).

# 2. Minification

Minification is a process of transforming a CSS document into a smaller document without losses. The typical strategies of achieving this are:

* safe modifications, such as removal of unnecessary elements (e.g. trailing semicolons) or transforming the values into more compact representations (e.g. `0px` to `0`);
* structural optimizations, such as removal of overridden properties or merging of blocks.

## 2.1. Safe transformations

### 2.1.1. Removal of whitespace

In some cases, whitespace characters (` `, `\n`, `\r`, `\t`, `\f`) are unnecessary and do not affect rendering.

* Before:

        .test
        {
            margin-top: 1em;

            margin-left  : 2em;
        }
* After:

        .test{margin-top:1em;margin-left:2em}

The following examples are provided with whitespace left intact for better readability.

### 2.1.2. Removal of trailing ';'

The last semicolon in a block is not required and does not affect rendering.

* Before:

        .test {
            margin-top: 1em;;
        }
* After:

        .test {
            margin-top: 1em
        }

### 2.1.3. Removal of comments

Comments do not affect rendering: \[[CSS 2.1 / 4.1.9 Comments](http://www.w3.org/TR/CSS21/syndata.html#comments)\].

* Before:

        /* comment */

        .test /* comment */ {
            /* comment */ margin-top: /* comment */ 1em;
        }
* After:

        .test {
            margin-top: 1em
        }

### 2.1.4. Removal of invalid @charset and @import declarations

According to the specification, `@charset` must be placed at the very beginning of the stylesheet: \[[CSS 2.1 / 4.4 CSS style sheet representation](http://www.w3.org/TR/CSS21/syndata.html#charset)\].

CSSO handles this rule in a slightly relaxed manner - we keep the `@charset` rule which immediately follows whitespace and comments in the beginning of the stylesheet.

Incorrectly placed `@import` rules are deleted according to \[[CSS 2.1 / 6.3 The @import rule](http://www.w3.org/TR/CSS21/cascade.html#at-import)\].

* Before:

        /* comment */
        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        @charset 'wrong';

        h1 {
            color: red
        }

        @import "wrong";
* After:

        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        h1 {
            color: red
        }

### 2.1.5. Removal of invalid elements

CSSO removes invalid elements but it doesn't check the correctness of property names and values. We assume that minification of an invalid CSS document is a bad practice.

According to \[[CSS 2.1 / 4.2 Rules for handling parsing errors](http://www.w3.org/TR/CSS21/syndata.html#parsing-errors)\] we are handling and correcting the following errors:

* Malformed declarations

    Before:

        .a { color:green; color }
        .b { color:red;   color; color:green }
        .c { color:green; color: }
        .d { color:red;   color:; color:green }
    After:

        .a, .b, .c, .d {
            color: green
        }
    The following errors are **not** corrected:

        p { color:green; color{;color:maroon} }
        p { color:red;   color{;color:maroon}; color:green }

* Unexpected end of string

    Before:

        p {
            color: green;
            font-family: 'Courier New Times
            color: red;
            color: green;
        }
    After:

        p {
            color: green
        }
    The following errors are **not** corrected:

        p[b="abcd
        efg"] {
            color : red
        }

### 2.1.6. Minification of color properties

Some color values are minimized according to \[[CSS 2.1 / 4.3.6 Colors](http://www.w3.org/TR/CSS21/syndata.html#color-units)\].

* Before:

        .test {
            color: yellow;
            border-color: #c0c0c0;
            background: #ffffff;
            border-top-color: #f00;
            outline-color: rgb(0, 0, 0);
        }
* After:

        .test {
            color: #ff0;
            border-color: silver;
            background: #fff;
            border-top-color: red;
            outline-color: #000
        }

### 2.1.7. Minification of 0

In some cases, the numeric values can be compacted to `0` or even dropped.

The `0%` value is not being compacted to avoid the following situation: `rgb(100%, 100%, 0)`.

* Before:

        .test {
            fakeprop: .0 0. 0.0 000 00.00 0px 0.1 0.1em 0.000em 00% 00.00% 010.00
        }
* After:

        .test {
            fakeprop: 0 0 0 0 0 0 .1 .1em 0 0% 0% 10
        }

### 2.1.8. Minification of margin and padding properties

The `margin` and `padding` properties are minimized according to \[[CSS 2.1 / 8.3 Margin properties](http://www.w3.org/TR/CSS21/box.html#margin-properties)\] и \[[CSS 2.1 / 8.4 Padding properties](http://www.w3.org/TR/CSS21/box.html#padding-properties)\].

* Before:

        .test0 {
            margin-top: 1em;
            margin-right: 2em;
            margin-bottom: 3em;
            margin-left: 4em;
        }

        .test1 {
            margin: 1 2 3 2
        }

        .test2 {
            margin: 1 2 1 2
        }

        .test3 {
            margin: 1 1 1 1
        }

        .test4 {
            margin: 1 1 1
        }

        .test5 {
            margin: 1 1
        }
* After:

        .test0 {
            margin: 1em 2em 3em 4em
        }

        .test1 {
            margin: 1 2 3
        }

        .test2 {
            margin: 1 2
        }

        .test3, .test4, .test5 {
            margin: 1
        }

### 2.1.9. Minification of multi-line strings

Multi-line strings are minified according to \[[CSS 2.1 / 4.3.7 Strings](http://www.w3.org/TR/CSS21/syndata.html#strings)\].

* Before:

        .test[title="abc\
        def"] {
            background: url("foo/\
        bar")
        }
* After:

        .test[title="abcdef"] {
            background: url("foo/bar")
        }

### 2.1.10. Minification of the font-weight property

The `bold` and `normal` values of the `font-weight` property are minimized according to \[[CSS 2.1 / 15.6 Font boldness: the 'font-weight' property](http://www.w3.org/TR/CSS21/fonts.html#font-boldness)\].

* Before:

        .test0 {
            font-weight: bold
        }

        .test1 {
            font-weight: normal
        }
* After:

        .test0 {
            font-weight: 700
        }

        .test1 {
            font-weight: 400
        }

## 2.2. Structural optimizations

#### 2.2.1. Merging blocks with identical selectors

Adjacent blocks with identical selectors are merged.

* Before:

        .test0 {
            margin: 0
        }

        .test1 {
            border: none
        }

        .test1 {
            background-color: green
        }

        .test0 {
            padding: 0
        }
* After:

        .test0 {
            margin: 0
        }

        .test1 {
            border: none;
            background-color: green
        }

        .test0 {
            padding: 0
        }

#### 2.2.2. Merging blocks with identical properties

Adjacent blocks with identical properties are merged.

* Before:

        .test0 {
            margin: 0
        }

        .test1 {
            border: none
        }

        .test2 {
            border: none
        }

        .test0 {
            padding: 0
        }
* After:

        .test0 {
            margin: 0
        }

        .test1, .test2 {
            border: none
        }

        .test0 {
            padding: 0
        }

#### 2.2.3. Removal of overridden properties

Properties ignored by the browser can be removed using the following rules:

* the last property in a CSS rule is applied, if none of the properties have an `!important` declaration;
* among `!important` properties, the last one is applied.

* Before:

        .test {
            color: red;
            margin: 0;
            line-height: 3cm;
            color: green;
        }
* After:

        .test {
            margin: 0;
            line-height: 3cm;
            color: green
        }

#### 2.2.4. Removal of repeating selectors

Repeating selectors can be removed.

* Before:

        .test, .test {
            color: red
        }
* After:

        .test {
            color: red
        }

#### 2.2.5. Partial merging of blocks

Given two adjacent blocks where one of the blocks is a subset of the other one, the following optimization is possible:

* overlapping properties are removed from the source block;
* the remaining properties of the source block are copied into a receiving block.

Minification will take place if character count of the properties to be copied is smaller than character count of the overlapping properties.

* Before:

        .test0 {
            color: red
        }

        .test1 {
            color: red;
            border: none
        }

        .test2 {
            border: none
        }
* After:

        .test0, .test1 {
            color: red
        }

        .test1, .test2 {
            border: none
        }

Minification won't take place if character count of the properties to be copied is larger than character count of the overlapping properties.

* Before:

        .test0 {
            color: red
        }

        .longlonglong {
            color: red;
            border: none
        }

        .test1 {
            border: none
        }
* After:

        .test0 {
            color: red
        }

        .longlonglong {
            color: red;
            border: none
        }

        .test1 {
            border: none
        }

#### 2.2.6. Partial splitting of blocks

If two adjacent blocks contain intersecting properties the following minification is possible:

* property intersection is determined;
* a new block containing the intersection is created in between the two blocks.

Minification will take place if there's a gain in character count.

* Before:

        .test0 {
            color: red;
            border: none;
            margin: 0
        }

        .test1 {
            color: green;
            border: none;
            margin: 0
        }
* After:

        .test0 {
            color: red
        }

        .test0, .test1 {
            border: none;
            margin: 0
        }

        .test1 {
            color: green
        }

Minification won't take place if there's no gain in character count.

* Before:

        .test0 {
            color: red;
            border: none;
            margin: 0
        }

        .longlonglong {
            color: green;
            border: none;
            margin: 0
        }
* After:

        .test0 {
            color: red;
            border: none;
            margin: 0
        }

        .longlonglong {
            color: green;
            border: none;
            margin: 0
        }

### 2.3. Managing structural optimizations

You can manually manage the structural optimizations that will take place using special comments.

#### 2.3.1. Guarding against deletion

Guarding against deletion of overridden properties is possible using a `/*p*/` comment before the protected property or a pair of `/*p<*/` - `/*>p*/` comments around the protected properties.

The opening `/*p<*/` comment guards all following properties regardless of the nesting level. The closing `/*>p*/` turns the guard off. Both comments can be used between blocks or properties.

Example of `/*p*/`:

* Before:

        .test {
            /*p*/color: red;
        }

        .test {
            color: green;
        }
* After:

        .test {
            color: red; <-- the property was not overridden by 'color: green'
            color: green
        }
* After (without a guard):

        .test {
            color: green
        }

Example of `/*p<*/` and `/*>p*/`:

* Before:

        /*p<*/
        .test0 {
            color: green;
            color: red;/*>p*/
            color: silver;
        }

        .test1 {
            color: white;
            color: green;
        }
* After:

        .test0 {
            color: red;
            color: silver
        }

        .test0, .test1 {
            color: green
        }
* After (without a guard):

        .test0 {
            color: silver
        }

        .test1 {
            color: green
        }

#### 2.3.2. Guarding against re-ordering

Guarding against re-ordering of properties is possible using an `/*o*/` comment before the protected property or a pair of `/*o<*/` - `/*>o*/` comments around the protected properties.

The opening `/*o<*/` comment guards all following properties regardless of the nesting level. The closing `/*>o*/` turns the guard off. Both comments can be used between blocks or properties.

Example of `/*o*/`:

* Before:

        .test0 {
            -moz-box-sizing: border-box;
            /*o*/-webkit-box-sizing: border-box;
            /*o*/box-sizing: border-box;
        }

        .test1 {
            box-sizing: border-box;
            /*o*/-moz-box-sizing: border-box;
            /*o*/-webkit-box-sizing: border-box;
        }
* After:

        .test0, .test1 {
            -moz-box-sizing: border-box
        }

        .test0 {
            -webkit-box-sizing: border-box;
            box-sizing: border-box
        }

        .test1 {
            box-sizing: border-box;
            -webkit-box-sizing: border-box
        }
* After (without a guard):

        .test0, .test1 {
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box
        }

Example of `/*o<*/` and `/*>o*/`:

* Before:

        /*o<*/
        .test0 {
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box;/*>o*/
            box-sizing: border-box;
        }

        .test1 {
            /*o<*/box-sizing: border-box;
            -moz-box-sizing: border-box;/*>o*/
            -webkit-box-sizing: border-box;
        }
* After:

        .test0, .test1 {
            box-sizing: border-box
        }

        .test0 {
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box
        }

        .test1 {
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box
        }
* After (without a guard):

        .test0, .test1 {
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box
        }

#### 2.3.3. Combining the guards

TODO.

# 3. Recommendations

Some stylesheets compress better than the others. Sometimes, one character difference can turn a well-compressible stylesheet to a very inconvenient one.

You can help the minimizer by following these recommendations.

## 3.1. Length of selectors

Shorter selectors are easier to re-group.

## 3.2. Order of properties

Stick to the same order of properties throughout the stylesheet - it will allow you to not use the guards. The less manual intervention there is, the easier it is for the minimizer to work optimally.

## 3.3. Positioning of similar blocks

Keep blocks with similar sets of properties close to each other.

Bad:

* Before:

        .test0 {
            color: red
        }

        .test1 {
            color: green
        }

        .test2 {
            color: red
        }
* After (53 characters):

        .test0{color:red}.test1{color:green}.test2{color:red}

Good:

* Before:

        .test1 {
            color: green
        }

        .test0 {
            color: red
        }

        .test2 {
            color: red
        }
* After (43 characters):

        .test1{color:green}.test0,.test2{color:red}

## 3.4. Using !important

It should go without saying that using the `!important` declaration harms minification performance.

Bad:

* Before:

        .test {
            margin: 1px;
            margin-left: 2px !important;
        }
* After (44 characters):

        .test{margin:1px;margin-left:2px !important}

Good:

* Before:

        .test {
            margin: 1px;
            margin-left: 2px;
        }
* After (29 characters):

        .test{margin:1px 1px 1px 2px}
