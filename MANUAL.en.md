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
* 2.2.3\. Removal of overriden properties
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

#### 2.2.3. Removal of overriden properties

Минимизация удалением перекрываемых свойств основана на том, что внутри блока применяется:

* последнее по порядку свойство, если все свойства не `!important`;
* последнее по порядку свойство `!important`.

Это позволяет избавиться от всех игнорируемых браузером свойств.

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

Повторяющиеся селекторы излишни и потому могут быть удалены.

* Before:

        .test, .test {
            color: red
        }
* After:

        .test {
            color: red
        }

#### 2.2.5. Partial merging of blocks

Если рядом расположены блоки, один из которых набором свойств полностью входит в другой, возможна следующая минимизация:

* в исходном (наибольшем) блоке удаляется пересекающийся набор свойств;
* селекторы исходного блока копируются в принимающий блок.

Если в символах размер копируемых селекторов меньше размера пересекающегося набора свойств, минимизация происходит.

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

Если в символах размер копируемых селекторов больше размера пересекающегося набора свойств, минимизация не происходит.

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

Если рядом расположены блоки, частично пересекающиеся набором свойств, возможна следующая минимизация:

* из обоих блоков выделяется пересекающийся набор свойств;
* между блоками создаётся новый блок с выделенным набором свойств и с селекторами обоих блоков.

Если в символах размер копируемых селекторов меньше размера пересекающегося набора свойств, минимизация происходит.

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

Если в символах размер копируемых селекторов больше размера пересекающегося набора свойств, минимизация не происходит.

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

Управление структурными изменениями происходит с помощью комментариев специального содержания.

#### 2.3.1. Guarding against deletion

Удаление перекрываемых свойств (см. 2.2.3) можно запрещать с помощью комментария `/*p*/` перед защищаемым свойством или с помощью пары комментариев `/*p<*/` и `/*>p*/`, между которыми находятся защищаемые свойства.

Комментарий `/*p<*/` защищает все следующие за ним свойства вне зависимости от того, на каком уровне вложенности они находятся. Комментарий `/*>p*/` выключает эту защиту. Любой из этих комментариев может находиться либо между блоками, либо между свойствами.

Пример использования `/*p*/`:

* Before:

        .test {
            /*p*/color: red;
        }

        .test {
            color: green;
        }
* After:

        .test {
            color: red; <-- свойство не было перекрыто 'color: green'
            color: green
        }
* After (without a guard):

        .test {
            color: green
        }

Пример использования пары `/*p<*/` и `/*>p*/`:

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

В процессе минимизации может произойти смена порядка, в котором следуют свойства. Например, сливаются два блока, которые отличаются лишь порядком свойств.

Смену порядка можно запрещать с помощью комментария `/*o*/` перед защищаемым свойством или с помощью пары комментариев `/*o<*/` и `/*>o*/`, между которыми находятся защищаемые свойства.

Комментарий `/*o<*/` защищает все следующие за ним свойства вне зависимости от того, на каком уровне вложенности они находятся. Комментарий `/*>o*/` выключает эту защиту. Любой из этих комментариев может находиться либо между блоками, либо между свойствами.

Пример использования `/*o*/`:

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

Пример использования пары `/*o<*/` и `/*>o*/`:

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

С точки зрения минимизации таблицы стилей можно разделить на две группы: удобные и неудобные. Разница даже в один символ может превратить вполне сокращаемый исходный текст в минимально обрабатываемый.

Если вы хотите помочь минимизатору хорошо выполнить работу, следуйте рекомендациям.

## 3.1. Length of selectors

Чем короче селектор (whitespace не учитываются), тем больше вероятность удачного группирования.

## 3.2. Order of properties

Придерживайтесь во всём CSS одного порядка, в котором перечисляются свойства, так вам не потребуется защита от смены порядка. Соответственно, меньше вероятность допустить ошибку и помешать минимизатору излишним управлением.

## 3.3. Positioning of similar blocks

Располагайте блоки со схожим набором свойств как можно ближе друг к другу.

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

Очевидно, `!important` оказывает серьёзное влияние на минимизацию, особенно заметно это может отразиться на минимизации `margin` и `padding`, потому им лучше не злоупотреблять.

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
