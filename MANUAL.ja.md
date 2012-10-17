# 目次

* 1\. はじめに
* 2\. 縮小化
* 2.1\. 基本的な変換
* 2.1.1\. ホワイトスペースの削除
* 2.1.2\. 最後尾の ';' の削除
* 2.1.3\. コメントの削除
* 2.1.4\. 不正な @charset と @import 宣言の削除
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

縮小化というのはCSSファイルをより軽量なサイズに、それも不具合無く、変換するプロセスのことを言います。基本的なテクニックに関しては以下のとおりです。

* 不必要な要素（例：最後尾のセミコロン）の削除や、値をよりコンパクトな表記に変更（例：`0px`を`0`に）するといったような基本的な変換
* 上書きされたプロパティの削除やブロックのマージなどのような構造的な変換


## 2.1. 基本的な変換

### 2.1.1. ホワイトスペースの削除

このようなホワイトスペース(` `, `\n`, `\r`, `\t`, `\f`)はレンダリングに影響しないため必要ありません。。

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

### 2.1.4. 不正な @charset と @import 宣言の削除

仕様書によれば `@charset` スタイルシートの先頭に置かなければなりません: \[[CSS 2.1 / 4.4 CSS style sheet representation](http://www.w3.org/TR/CSS21/syndata.html#charset)\].

CSSOは少しゆるやかにこのルールを操作します。- スタイルシートの上部にあり、ホワイトスペースやコメントのすぐ後にある`@charset`を保持します。

\[[CSS 2.1 / 6.3 The @import rule](http://www.w3.org/TR/CSS21/cascade.html#at-import)\] の仕様に従って、間違った場所に置かれた`@import`は削除します。

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

\[[CSS 2.1 / 4.3.6 Colors](http://www.w3.org/TR/CSS21/syndata.html#color-units)\] の仕様に従って、色の値を変換します。

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

あるケースにおいて、数値は`0`にすることでコンパクトにできますし、ときには削除さえします。

`0%`の値は次のようなケースを考えると縮小化できません。 `rgb(100%, 100%, 0)`

* 変換前:

        .test {
            fakeprop: .0 0. 0.0 000 00.00 0px 0.1 0.1em 0.000em 00% 00.00% 010.00
        }
* 変換後:

        .test {
            fakeprop: 0 0 0 0 0 0 .1 .1em 0 0% 0% 10
        }

### 2.1.7. 複数行文字列の縮小化

\[[CSS 2.1 / 4.3.7 Strings](http://www.w3.org/TR/CSS21/syndata.html#strings)\] の仕様に従って、複数行文字列は縮小化されます。

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

### 2.1.8. font-weight プロパティの縮小化

\[[CSS 2.1 / 15.6 Font boldness: the 'font-weight' property](http://www.w3.org/TR/CSS21/fonts.html#font-boldness)\] の仕様に従って、`font-weight`プロパティの`bold` と `normal`は縮小化されます。

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

## 2.2. 構造的な最適化

### 2.2.1. 同一セレクタブロックのマージ

同一のセレクタで隣接するブロックはマージされます。

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

### 2.2.2. ブロック内の同一プロパティのマージ

隣接するブロック内の同一プロパティはマージされます。

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

### 2.2.3. 上書きされたプロパティの削除

次のルールにより、ブラウザーによって無視されるプロパティは削除されます。

* the last property in a CSS rule is applied, if none of the properties have an `!important` declaration;

* もし、`!important`宣言がなければ、CSSルールないの最後のプロパティが適用されます。
* `!important`が宣言されたプロパティが複数あれば、最後のものが適用されます。

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

#### 2.2.3.1. 上書きされたショートハンドプロパティの削除

`border`, `margin`, `padding`, `font`, `list-style` プロパティの場合、 次の削除ルールが適用されます: もし最後のプロパティが 'general' であれば (例： `border`), すべての先行の上書きされたプロパティは削除されます（例：`border-top-width` または `border-style`)。

* 変換前:

        .test {
            border-top-color: red;
            border-color: green
        }
* 変換後:

        .test {
            border-color:green
        }

### 2.2.4. 繰り返されているプロパティの削除

繰り返されているプロパティは削除されます。

* 変換前:

        .test, .test {
            color: red
        }
* 変換後:

        .test {
            color: red
        }

### 2.2.5. ブロックの部分的なマージ

2つの隣接するブロックがあり、片方がもう片方のサブセットの場合、次の最適化が考えられます。

* 重複するプロパティは、ブロックから削除されます。
* ブロックの残りのプロパティは受け手のブロックにコピーされます。

重複プロパティの文字数よりもコピーするプロパティの文字数が少なければ、縮小化が実行されます。

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


重複プロパティの文字数よりもコピーするプロパティの文字数が多いので、縮小化が実行されません。

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

### 2.2.6. ブロックの部分的な分割

隣接する2つのブロックに重複するプロパティがあれば、縮小化が行われます。

* 新しいブロックには2つのブロックの重複プロパティが含まれています。

文字数の節約が期待できるのであれは縮小化が実行されます。

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

文字数が増えるので縮小化が実行されません。

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

### 2.2.7. 空のルールセット、ルールの削除

空のルールセットとルールは削除されます。

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

### 2.2.8. margin と padding プロパティの縮小化

\[[CSS 2.1 / 8.3 Margin properties](http://www.w3.org/TR/CSS21/box.html#margin-properties)\] и \[[CSS 2.1 / 8.4 Padding properties](http://www.w3.org/TR/CSS21/box.html#padding-properties)\]の仕様に従って、`margin`と`padding`プロパティの縮小化がされます。

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

スタイルシート全体で同じプロパティ順を守る。ガードしなくてもよくなります。つまり、手動による介入が減ることでそれはminimizerの効率を高めることになります。

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
