# 目次

* 1\. はじめに
* 2\. 縮小化
* 2.1\. 基本的な変換
* 2.1.1\. ホワイトスペースの削除
* 2.1.2\. 最後尾の ';' の削除
* 2.1.3\. コメントの削除
* 2.1.4\. 無意味な @charset と @import 宣言の削除
* 2.1.5\. color プロパティの縮小化
* 2.1.6\. 0 の縮小化
* 2.1.7\. 複数行文字列の縮小化
* 2.1.8\. font-weight プロパティの縮小化
* 2.2\. 構造的な最適化
* 2.2.1\. 同一セレクタブロックのマージ
* 2.2.2\. ブロック内の同一プロパティのマージ
* 2.2.3\. 上書きされたプロパティの削除
* 2.2.3.1\. 上書きされたショートハンドプロパティの削除
* 2.2.4\. 繰り返されているプロパティの削除
* 2.2.5\. ブロックの部分的なマージ
* 2.2.6\. ブロックの部分的な分割
* 2.2.7\. 空のルールセット、ルールの削除
* 2.2.8\. margin と padding プロパティの縮小化
* 3\. リコメンド
* 3.1\. セレクタの長さ
* 3.2\. プロパティの並び順
* 3.3\. 似たようなブロックの配置
* 3.4\. !important の使用

# 1. はじめに

CSSO(CSS Optimizer)は、他とはちがうCSS minimizerです。なぜなら通常のCSS縮小化テクニックに加えて、CSSファイルの構造的な最適化もするため、他のminifierと比べてより軽量な結果となります。

このドキュメントは私達が採用している縮小化テクニックに関して説明しています。インストールの仕方や使用方法を知りたい場合は[こちら](https://github.com/afelix/csso/blob/master/README.md)をご覧ください。

# 2. 縮小化

Minification is a process of transforming a CSS document into a smaller document without losses. The typical strategies of achieving this are:

縮小化というのはCSSファイルをより軽量なサイズに、それも不具合無く、変換するプロセスのことを言います。典型的なテクニックに関しては以下のとおりです。

* 不必要な要素（例：最後尾のセミコロン）の削除や、値をよりコンパクトな表記に変更（例：`0px`を`0`に）するといったような基本的な変換
* 上書きされたプロパティの削除やブロックのマージなどのような構造的な変換


## 2.1. 基本的な変換

### 2.1.1. ホワイトスペースの削除

この場合、ホワイトスペース文字列(` `, `\n`, `\r`, `\t`, `\f`)はレンダリングに影響しないため不必要です。

* 変換前:

        .test
        {
            margin-top: 1em;

            margin-left  : 2em;
        }
* 変換後:

        .test{margin-top:1em;margin-left:2em}

これ以降の例に関しては、可読性を考慮してホワイトスペースを残したままにしておきます。

### 2.1.2. 最後尾の ';' の削除

最後のセミコロンは必要ではなく、レンダリングにも影響しません。

* 変換前:

        .test {
            margin-top: 1em;;
        }
* 変換後:

        .test {
            margin-top: 1em
        }

### 2.1.3. コメントの削除

コメントはレンダリングに影響しません: \[[CSS 2.1 / 4.1.9 Comments](http://www.w3.org/TR/CSS21/syndata.html#comments)\].

* 変換前:

        /* コメント */

        .test /* コメント */ {
            /* コメント */ margin-top: /* コメント */ 1em;
        }
* 変換後:

        .test {
            margin-top: 1em
        }

### 2.1.4. 無意味な @charset と @import 宣言の削除

仕様書によれば `@charset` スタイルシートの先頭に置かなければなりません: \[[CSS 2.1 / 4.4 CSS style sheet representation](http://www.w3.org/TR/CSS21/syndata.html#charset)\].

CSSOは少しゆるやかにこのルールを操作します。- `@charset` rule which immediately follows whitespace and comments in the beginning of the stylesheet.

Incorrectly placed `@import` rules are deleted according to \[[CSS 2.1 / 6.3 The @import rule](http://www.w3.org/TR/CSS21/cascade.html#at-import)\].

* 変換前:

        /* comment */
        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        @charset 'wrong';

        h1 {
            color: red
        }

        @import "wrong";
* 変換後:

        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        h1 {
            color: red
        }

### 2.1.5. color プロパティの縮小化

Some color values are minimized according to \[[CSS 2.1 / 4.3.6 Colors](http://www.w3.org/TR/CSS21/syndata.html#color-units)\].

* 変換前:

        .test {
            color: yellow;
            border-color: #c0c0c0;
            background: #ffffff;
            border-top-color: #f00;
            outline-color: rgb(0, 0, 0);
        }
* 変換後:

        .test {
            color: #ff0;
            border-color: silver;
            background: #fff;
            border-top-color: red;
            outline-color: #000
        }

### 2.1.6. 0 の縮小化

In some cases, the numeric values can be compacted to `0` or even dropped.

The `0%` value is not being compacted to avoid the following situation: `rgb(100%, 100%, 0)`.

* 変換前:

        .test {
            fakeprop: .0 0. 0.0 000 00.00 0px 0.1 0.1em 0.000em 00% 00.00% 010.00
        }
* 変換後:

        .test {
            fakeprop: 0 0 0 0 0 0 .1 .1em 0 0% 0% 10
        }

### 2.1.7. Minification of multi-line strings

Multi-line strings are minified according to \[[CSS 2.1 / 4.3.7 Strings](http://www.w3.org/TR/CSS21/syndata.html#strings)\].

* 変換前:

        .test[title="abc\
        def"] {
            background: url("foo/\
        bar")
        }
* 変換後:

        .test[title="abcdef"] {
            background: url("foo/bar")
        }

### 2.1.8. Minification of the font-weight property

The `bold` and `normal` values of the `font-weight` property are minimized according to \[[CSS 2.1 / 15.6 Font boldness: the 'font-weight' property](http://www.w3.org/TR/CSS21/fonts.html#font-boldness)\].

* 変換前:

        .test0 {
            font-weight: bold
        }

        .test1 {
            font-weight: normal
        }
* 変換後:

        .test0 {
            font-weight: 700
        }

        .test1 {
            font-weight: 400
        }

## 2.2. Structural optimizations

### 2.2.1. Merging blocks with identical selectors

Adjacent blocks with identical selectors are merged.

* 変換前:

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
* 変換後:

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

### 2.2.2. Merging blocks with identical properties

Adjacent blocks with identical properties are merged.

* 変換前:

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
* 変換後:

        .test0 {
            margin: 0
        }

        .test1, .test2 {
            border: none
        }

        .test0 {
            padding: 0
        }

### 2.2.3. Removal of overridden properties

Properties ignored by the browser can be removed using the following rules:

* the last property in a CSS rule is applied, if none of the properties have an `!important` declaration;
* among `!important` properties, the last one is applied.

* 変換前:

        .test {
            color: red;
            margin: 0;
            line-height: 3cm;
            color: green;
        }
* 変換後:

        .test {
            margin: 0;
            line-height: 3cm;
            color: green
        }

#### 2.2.3.1. Removal of overridden shorthand properties

In case of `border`, `margin`, `padding`, `font` and `list-style` properties, the following removal rule will be applied: if the last property is a 'general' one (for example, `border`), then all preceding overridden properties will be removed (for example, `border-top-width` or `border-style`).

* 変換前:

        .test {
            border-top-color: red;
            border-color: green
        }
* 変換後:

        .test {
            border-color:green
        }

### 2.2.4. Removal of repeating selectors

Repeating selectors can be removed.

* 変換前:

        .test, .test {
            color: red
        }
* 変換後:

        .test {
            color: red
        }

### 2.2.5. Partial merging of blocks

Given two adjacent blocks where one of the blocks is a subset of the other one, the following optimization is possible:

* overlapping properties are removed from the source block;
* the remaining properties of the source block are copied into a receiving block.

Minification will take place if character count of the properties to be copied is smaller than character count of the overlapping properties.

* 変換前:

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
* 変換後:

        .test0, .test1 {
            color: red
        }

        .test1, .test2 {
            border: none
        }

Minification won't take place if character count of the properties to be copied is larger than character count of the overlapping properties.

* 変換前:

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
* 変換後:

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

### 2.2.6. Partial splitting of blocks

If two adjacent blocks contain intersecting properties the following minification is possible:

* property intersection is determined;
* a new block containing the intersection is created in between the two blocks.

Minification will take place if there's a gain in character count.

* 変換前:

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
* 変換後:

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

* 変換前:

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
* 変換後:

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

### 2.2.7. Removal of empty ruleset and at-rule

Empty ruleset and at-rule will be removed.

* 変換前:

        .test {
            color: red
        }

        .empty {}

        @font-face {}

        @media print {
            .empty {}
        }

        .test {
            border: none
        }
* 変換後:

        .test{color:red;border:none}

### 2.2.8. Minification of margin and padding properties

The `margin` and `padding` properties are minimized according to \[[CSS 2.1 / 8.3 Margin properties](http://www.w3.org/TR/CSS21/box.html#margin-properties)\] и \[[CSS 2.1 / 8.4 Padding properties](http://www.w3.org/TR/CSS21/box.html#padding-properties)\].

* 変換前:

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
* 変換後:

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

# 3. リコメンド

いくつかのスタイルシートは他のものよりも圧縮効率が高いことがあります。時には一文字の違いで圧縮効率に違いが生まれてきます。

以下のリコメンドに従うことでminimizerをより効率的に機能させることが可能です。

## 3.1. セレクタの長さ

短いセレクタ名ですと再グループしやすいです。

## 3.2. プロパティの並び順

Stick to the same order of properties throughout the stylesheet - it will allow you to not use the guards. The less manual intervention there is, the easier it is for the minimizer to work optimally.

## 3.3. 同様なブロックの配置

似たようなルールセットのブロックは互いに近くに配置するとよいです。

悪い:

* 変換前:

        .test0 {
            color: red
        }

        .test1 {
            color: green
        }

        .test2 {
            color: red
        }
* 変換後 (53文字):

        .test0{color:red}.test1{color:green}.test2{color:red}

良い:

* 変換前:

        .test1 {
            color: green
        }

        .test0 {
            color: red
        }

        .test2 {
            color: red
        }
* 変換後 (43文字):

        .test1{color:green}.test0,.test2{color:red}

## 3.4. !important の使用

言うまでもなく `!important` 宣言は縮小化に悪影響を与えます.

悪い:

* 変換前:

        .test {
            margin-left: 2px !important;
            margin: 1px;
        }
* 変換後 (43文字):

        .test{margin-left:2px!important;margin:1px}

良い:

* 変換前:

        .test {
            margin-left: 2px;
            margin: 1px;
        }
* 変換後 (17文字):

        .test{margin:1px}
