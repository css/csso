# Содержание

* 1\. Описание
* 2\. Минимизация
* 2.1\. Минимизация без изменения структуры
* 2.1.1\. Удаление whitespace
* 2.1.2\. Удаление концевых ';'
* 2.1.3\. Удаление комментариев
* 2.1.4\. Удаление неправильных @charset и @import
* 2.1.5\. Удаление ошибочных элементов
* 2.1.6\. Минимизация цвета
* 2.1.7\. Минимизация 0
* 2.1.8\. Минимизация margin и padding
* 2.1.9\. Слияние многострочных строк в однострочные
* 2.1.10\. Минимизация font-weight
* 2.2\. Минимизация с изменением структуры
* 2.2.1\. Слияние блоков с одинаковыми селекторами
* 2.2.2\. Слияние блоков с одинаковыми свойствами
* 2.2.3\. Удаление перекрываемых свойств
* 2.2.4\. Частичное слияние блоков
* 2.3\. Управление структурными изменениями
* 2.3.1\. Защита от удаления
* 2.3.2\. Защита от смены порядка
* 2.3.3\. Комбинирование защит
* 3\. Рекомендации
* 3.1\. Длина селекторов
* 3.2\. Порядок свойств
* 3.3\. Расположение схожих блоков
* 3.4\. Использование !important

# 1. Описание

CSSO (CSS Optimizer) является минимизатором CSS, выполняющим как минимизацию без изменения структуры, так и структурную минимизацию с целью получить как можно меньший текст.

Этот документ описывает минимизацию детально. Если вам нужна инструкция по установке, она находится [здесь](https://github.com/afelix/csso/blob/master/README.md).

# 2. Минимизация

Цель минимизации заключается в трансформации исходного CSS в CSS меньшего размера. Наиболее распространёнными стратегиями в достижении этой цели являются:

* минимизация без изменения структуры&nbsp;— удаление необязательных элементов (например, `;` у последнего свойства в блоке), сведение значений к меньшим по размеру (например, `0px` к `0`) и т.п.;
* минимизация с изменением структуры&nbsp;— удаление перекрываемых свойств, полное или частичное слияние блоков.

## 2.1. Минимизация без изменения структуры

### 2.1.1. Удаление whitespace

В ряде случаев символы ряда whitespace (` `, `\n`, `\r`, `\t`, `\f`) являются необязательными и не влияют на результат применения таблицы стилей.

* Было:

    .test
    {
        margin-top: 1em;

        margin-left  : 2em;
    }

* Стало:
    .test{margin-top:1em;margin-left:2em}

Для большего удобства чтения текст остальных примеров приводится с пробелами (переводом строки и т.п.).

### 2.1.2. Удаление концевых ';'

Символ `;`, завершающий перечисление свойств в блоке, является необязательным и не влияет на результат применения таблицы стилей.

* Было:
        .test {
            margin-top: 1em;;
        }
* Стало:
        .test {
            margin-top: 1em
        }

### 2.1.3. Удаление комментариев

Комментарии не влияют на результат применения таблицы стилей: \[[CSS 2.1 / 4.1.9 Comments](http://www.w3.org/TR/CSS21/syndata.html#comments)\].

* Было:
        /* comment */

        .test /* comment */ {
            /* comment */ margin-top: /* comment */ 1em;
        }
* Стало:
        .test {
            margin-top: 1em
        }

### 2.1.4. Удаление неправильных @charset и @import

Единственно верным расположением `@charset` является начало текста: \[[CSS 2.1 / 4.4 CSS style sheet representation](http://www.w3.org/TR/CSS21/syndata.html#charset)\].

Однако CSSO позволяет обходиться с этим правилом достаточно вольно, т.к. оставляет первый после whitespace и комментариев `@charset`.

Правило `@import` на неправильном месте удаляется согласно \[[CSS 2.1 / 6.3 The @import rule](http://www.w3.org/TR/CSS21/cascade.html#at-import)\].

* Было:
        /* comment */
        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        @charset 'wrong';

        h1 {
            color: red
        }

        @import "wrong";
* Стало:
        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        h1 {
            color: red
        }

### 2.1.5. Удаление ошибочных элементов

Минимизатор удаляет те элементы, что являются ошибочными структурно, но не проверяет правильность имён или значений свойств. Предполагается, что минимизировать неправильный CSS является в свою очередь неправильным.

Из \[[CSS 2.1 / 4.2 Rules for handling parsing errors](http://www.w3.org/TR/CSS21/syndata.html#parsing-errors)\] поддерживается обработка и коррекция следующих ошибок:

* Malformed declarations

    Было:
        .a { color:green; color }
        .b { color:red;   color; color:green }
        .c { color:green; color: }
        .d { color:red;   color:; color:green }
    Стало:
        .a, .b, .c, .d {
            color: green
        }
    **Не** поддерживается обработка следующих ошибок:
        p { color:green; color{;color:maroon} }
        p { color:red;   color{;color:maroon}; color:green }

* Unexpected end of string

    Было:
        p {
            color: green;
            font-family: 'Courier New Times
            color: red;
            color: green;
        }
    Стало:
        p {
            color: green
        }
    **Не** поддерживается обработка следующих ошибок:
        p[b="abcd
        efg"] {
            color : red
        }

### 2.1.6. Минимизация цвета

Некоторые значения цвета минимизируются согласно \[[CSS 2.1 / 4.3.6 Colors](http://www.w3.org/TR/CSS21/syndata.html#color-units)\].

* Было:
        .test {
            color: yellow;
            border-color: #c0c0c0;
            background: #ffffff;
            border-top-color: #f00;
            outline-color: rgb(0, 0, 0);
        }
* Стало:
        .test {
            color: #ff0;
            border-color: silver;
            background: #fff;
            border-top-color: red;
            outline-color: #000
        }

### 2.1.7. Минимизация 0

В ряде случаев числовое значение можно сократить до `0` или же отбросить `0`.

Значения `0%` не сокращаются до `0`, чтобы избежать ошибок вида `rgb(100%, 100%, 0)`.

* Было:
        .test {
            fakeprop: .0 0. 0.0 000 00.00 0px 0.1 0.1em 0.000em 00% 00.00% 010.00
        }
* Стало:
        .test {
            fakeprop: 0 0 0 0 0 0 .1 .1em 0 0% 0% 10
        }

### 2.1.8. Минимизация margin и padding

Свойства `margin` и `padding` минимизируются согласно \[[CSS 2.1 / 8.3 Margin properties](http://www.w3.org/TR/CSS21/box.html#margin-properties)\] и \[[CSS 2.1 / 8.4 Padding properties](http://www.w3.org/TR/CSS21/box.html#padding-properties)\].

* Было:
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
* Стало:
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

### 2.1.9. Слияние многострочных строк в однострочные

Многострочные строки минимизируются согласно \[[CSS 2.1 / 4.3.7 Strings](http://www.w3.org/TR/CSS21/syndata.html#strings)\].

* Было:
        .test[title="abc\
        def"] {
            background: url("foo/\
        bar")
        }
* Стало:
        .test[title="abcdef"] {
            background: url("foo/bar")
        }

### 2.1.10. Минимизация font-weight

Значения `bold` и `normal` свойства `font-weight` минимизируются согласно \[[CSS 2.1 / 15.6 Font boldness: the 'font-weight' property](http://www.w3.org/TR/CSS21/fonts.html#font-boldness)\].

* Было:
        .test0 {
            font-weight: bold
        }

        .test1 {
            font-weight: normal
        }
* Стало:
        .test0 {
            font-weight: 700
        }

        .test1 {
            font-weight: 400
        }

## 2.2. Минимизация с изменением структуры

#### 2.2.1. Слияние блоков с одинаковыми селекторами

В один блок сливаются соседние блоки с одинаковым набором селекторов.

* Было:
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
* Стало:
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

#### 2.2.2. Слияние блоков с одинаковыми свойствами

В один блок сливаются соседние блоки с одинаковым набором свойств.

* Было:
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
* Стало:
        .test0 {
            margin: 0
        }

        .test1, .test2 {
            border: none
        }

        .test0 {
            padding: 0
        }

#### 2.2.3. Удаление перекрываемых свойств

Минимизация удалением перекрываемых свойств основана на том, что внутри блока применяется:

* последнее по порядку свойство, если все свойства не `!important`;
* последнее по порядку свойство `!important`.

Это позволяет избавиться от всех игнорируемых браузером свойств.

* Было:
        .test {
            color: red;
            margin: 0;
            line-height: 3cm;
            color: green;
        }
* Стало:
        .test {
            margin: 0;
            line-height: 3cm;
            color: green
        }

#### 2.2.4. Частичное слияние блоков

Если рядом расположены блоки, один из которых набором свойств полностью входит в другой, возможна следующая минимизация:

* в исходном (наибольшем) блоке удаляется пересекающийся набор свойств;
* селекторы исходного блока копируются в принимающий блок.

* Было:
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
* Стало:
        .test0, .test1 {
            color: red
        }

        .test1, .test2 {
            border: none
        }

Если в символах размер копируемых селекторов больше размера пересекающегося набора свойств, минимизация не производится.

* Было:
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
* Стало:
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

### 2.3. Управление структурными изменениями

Управление структурными изменениями происходит с помощью комментариев специального содержания.

#### 2.3.1. Защита от удаления

Удаление перекрываемых свойств (см. 2.2.1.2) можно запрещать с помощью комментария `/*p*/` перед защищаемым свойством или с помощью пары комментариев `/*p<*/` и `/*>p*/`, между которыми находятся защищаемые свойства.

Комментарий `/*p<*/` защищает все следующие за ним свойства вне зависимости от того, на каком уровне вложенности они находятся. Комментарий `/*>p*/` выключает эту защиту. Любой из этих комментариев может находиться либо между блоками, либо между свойствами.

Пример использования `/*p*/`:

* Было с защитой:
        .test {
            /*p*/color: red;
        }

        .test {
            color: green;
        }
* Стало с защитой:
        .test {
            color: red; <-- свойство не было перекрыто 'color: green'
            color: green
        }
* Стало без защиты:
        .test {
            color: green
        }

Пример использования пары `/*p<*/` и `/*>p*/`:

* Было с защитой:
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
* Стало с защитой:
        .test0 {
            color: red;
            color: silver
        }

        .test0, .test1 {
            color: green
        }
* Стало без защиты:
        .test0 {
            color: silver
        }

        .test1 {
            color: green
        }

#### 2.3.2. Защита от смены порядка

В процессе минимизации может произойти смена порядка, в котором следуют свойства. Например, сливаются два блока, которые отличаются лишь порядком свойств.

Смену порядка можно запрещать с помощью комментария `/*o*/` перед защищаемым свойством или с помощью пары комментариев `/*o<*/` и `/*>o*/`, между которыми находятся защищаемые свойства.

Комментарий `/*o<*/` защищает все следующие за ним свойства вне зависимости от того, на каком уровне вложенности они находятся. Комментарий `/*>o*/` выключает эту защиту. Любой из этих комментариев может находиться либо между блоками, либо между свойствами.

Пример использования `/*o*/`:

* Было с защитой:
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
* Стало с защитой:
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
* Стало без защиты:
        .test0, .test1 {
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box
        }

Пример использования пары `/*o<*/` и `/*>o*/`:

* Было с защитой:
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
* Стало с защитой:
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
* Стало без защиты:
      .test0, .test1 {
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box
        }

#### 2.3.3. Комбинирование защит

TODO.

# 3. Рекомендации

С точки зрения минимизации таблицы стилей можно разделить на две группы: удобные и неудобные. Разница даже в один символ может превратить вполне сокращаемый исходный текст в минимально обрабатываемый.

Если вы хотите помочь минимизатору хорошо выполнить работу, следуйте рекомендациям.

## 3.1. Длина селекторов

Чем короче селектор (whitespace не учитываются), тем больше вероятность удачного группирования.

## 3.2. Порядок свойств

Придерживайтесь во всём CSS одного порядка, в котором перечисляются свойства, так вам не потребуется защита от смены порядка. Соответственно, меньше вероятность допустить ошибку и помешать минимизатору излишним управлением.

## 3.3. Расположение схожих блоков

Располагайте блоки со схожим набором свойств как можно ближе друг к другу.

Плохо:

* Было:
        .test0 {
            color: red
        }

        .test1 {
            color: green
        }

        .test2 {
            color: red
        }
* Стало (53 символа):
        .test0{color:red}.test1{color:green}.test2{color:red}

Хорошо:

* Было:
        .test1 {
            color: green
        }

        .test0 {
            color: red
        }

        .test2 {
            color: red
        }
* Стало (43 символа):
        .test1{color:green}.test0,.test2{color:red}

## 3.4. Использование !important

Очевидно, `!important` оказывает серьёзное влияние на минимизацию, особенно заметно это может отразиться на минимизации `margin` и `padding`, потому им лучше не злоупотреблять.

Плохо:

* Было:
        .test {
            margin: 1px;
            margin-left: 2px !important;
        }
* Стало (44 символа):
        .test{margin:1px;margin-left:2px !important}

Хорошо:

* Было:
        .test {
            margin: 1px;
            margin-left: 2px;
        }
* Стало (29 символов):
        .test{margin:1px 1px 1px 2px}
