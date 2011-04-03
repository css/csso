# Содержание

# 1. Описание

TODO

# 2. Минимизация

Цель минимизации заключается в трансформации исходного стиля в стиль меньшего размера. Наиболее распространёнными стратегиями в достижении этой цели являются:

* минимизация без изменения структуры&nbsp;— удаление необязательных элементов стиля (например, `;` у последнего свойства в блоке), сведение значений к меньшим по размеру (например, `0px` к `0`) и т.п.;
* минимизация с изменением структуры&nbsp;— удаление перекрываемых свойств, слияние одинаковых блоков, частичное выделение или слияние блоков.

## 2.1. Минимизация без изменения структуры

TODO

### 2.1.1. Удаление whitespace

В ряде случаев символы ряда whitespace (` `, `\n`, `\r`, `\t`, `\f`) являются необязательными и не влияют на результат применения стиля.

Было:
    .test
    {
        margin-top: 1em;
        
        margin-left  : 2em;
    }
Стало:
    .test{margin-top:1em;margin-left:2em}
Для большего удобства чтения текст остальных примеров приводится с пробелами (переводом строки и т.п.).

### 2.1.2. Удаление концевых `;`

Символ `;`, завершающий перечисление свойств в блоке, является необязательным и не влияет на результат применения стиля.

Было:
    .test {
        margin-top: 1em;;
    }
Стало:
    .test {
        margin-top: 1em
    }

### 2.1.3. Удаление комментариев

Комментарии не влияют на результат применения стиля: [CSS 2.1 / 4.1.9 Comments](http://www.w3.org/TR/CSS21/syndata.html#comments)

Было:
    /* comment */

    .test /* comment */ {
        /* comment */ margin-top: /* comment */ 1em;
    }
Стало:
    .test {
        margin-top: 1em
    }

### 2.1.4. Удаление неправильного @charset

Единственно верным расположением `@charset` является начало стиля: [CSS 2.1 / 4.4 CSS style sheet representation](http://www.w3.org/TR/CSS21/syndata.html#charset)

Однако CSSO позволяет обходиться с этим правилом достаточно вольно, т.к. оставляет первый после whitespace и комментариев `@charset`.

Было:
    /* comment */
    @charset 'UTF-8';

    .test {
        color: red;
    }

    @charset 'ISO-8859-15';
Стало:
    @charset 'UTF-8';

    .test {
        color: red
    }

### 2.1.5. Удаление ошибочных элементов стиля

TODO

Минимизатор удаляет те элементы, что являются ошибочными структурно, но не проверяет на правильность имена или значения свойств.

Таким образом, из [CSS 2.1 / 4.2 Rules for handling parsing errors](http://www.w3.org/TR/CSS21/syndata.html#parsing-errors) поддерживается обработка и коррекция следующих ошибок:

* Malformed declarations.

    Было:
        TODO
    Стало (без учёта остальной минимизации):
        TODO

* Malformed statements.

    Было:
        TODO
    Стало (без учёта остальной минимизации):
        TODO

* Unexpected end of style sheet.

    Было:
        TODO
    Стало (без учёта остальной минимизации):
        TODO

* Unexpected end of string.

    Было:
        TODO
    Стало (без учёта остальной минимизации):
        TODO

### 2.1.6. Минимизация цвета

TODO

Было:
    .test {
        color: yellow;
        border-color: #c0c0c0;
        background: #ffffff;
        border-top-color: #f00;
        outline-color: rgb(0, 0, 0);
    }
Стало:
    .test {
        color: #ff0;
        border-color: silver;
        background: #fff;
        border-top-color: red;
        outline-color: #000
    }

### 2.1.7. Минимизация `0`

TODO

Было:
    .test {
        fakeprop: .0 0. 0.0 000 00.00 0px 0.1 0.1em 0.000em 00% 00.00% 010.00
    }
Стало:
    .test {
        fakeprop: 0 0 0 0 0 0 .1 .1em 0 0% 0% 10
    }

### 2.1.8. Минимизация margin и padding

TODO

Было:
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
Стало:
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

TODO

Было:
    .test[title="abc\
    def"] {
        background: url("foo/\
    bar")
    }

Стало:
    .test[title="abcdef"] {
        background: url("foo/bar")
    }

### 2.1.10. Минимизация `font-weight`

TODO

Было:
    .test0 {
        font-weight: bold
    }
    
    .test1 {
        font-weight: normal
    }
Стало:
    .test0 {
        font-weight: 700
    }
    
    .test1 {
        font-weight: 400
    }

## 2.2. Минимизация с изменением структуры

TODO

### 2.2.1. Расчёт стиля

TODO

#### 2.2.1.1. Слияние блоков с одинаковыми селекторами

TODO

Было:
    .test0 {
        color: red;
        margin: 0;
    }
    
    .test1 {
        font-size: 12pt
    }
    
    .test0 {
        line-height: 3cm
    }
    
    .test1 {
        text-indent: 3em;
    }
Стало:
    .test0 {
        color: red;
        margin: 0;
        line-height: 3cm
    }
    
    .test1 {
        font-size: 12pt;
        text-indent: 3em
    }

#### 2.2.1.2. Удаление перекрываемых свойств

TODO

Было:
    .test {
        color: red;
        margin: 0;
        line-height: 3cm;
        color: green;
    }
Стало:
    .test {
        margin: 0;
        line-height: 3cm;
        color: green
    }

### 2.2.2. Группирование

TODO

#### 2.2.2.1. Частичное выделение свойств в отдельный блок

TODO

Суммарная длина выделяемых свойств должна быть больше суммарной длины копируемых селекторов.

a) Выделение произошло.

Было:
    .test0 {
        color: red;
        font: x-large/110% "New Century Schoolbook", serif;
        margin: 10px;
    }
    
    .test1 {
        color: red;
        font: x-large/110% "New Century Schoolbook", serif;
        margin: 20px;
    }
Стало:
    .test0, .test1 {
        color: red;
        font: x-large/110% "New Century Schoolbook",serif
    }
    
    .test0 {
        margin: 10px
    }
    
    .test1 {
        margin: 20px
    }
б) Выделение не произошло.

Было:
    .test0 {
        color: red;
        margin: 10px;
    }
    
    .test1 {
        color: red;
        margin: 20px;
    }
Стало:
    .test0 {
        color: red;
        margin: 10px
    }
    
    .test1 {
        color: red;
        margin: 20px
    }

#### 2.2.2.2. Частичное слияние блоков

TODO

а) Частичное слияние при соседнем расположении.

Если рядом расположены блоки, один из которых набором свойств полностью входит в другой, происходит следующее:

* в исходном (наибольшем) блоке удаляется пересекающийся набор свойств;
* селекторы исходного блока копируются в принимающий блок.

Направление слияния роли не играет.

Было:
    .test0 {
        color: red;
        font: x-large/110% "New Century Schoolbook", serif;
        margin: 10px;
    }
    
    .test1 {
        color: red;
        font: x-large/110% "New Century Schoolbook", serif;
    }
Стало:
    .test0 {
        margin: 10px
    }
    
    .test0, .test1 {
        color: red;
        font: x-large/110% "New Century Schoolbook",serif
    }
б) Частичное слияние при удалённом расположении.

Если между исходным блоком и принимающим блоком находится блок с непересекающимся набором свойств, частичное слияние возможно только снизу вверх.

Было:
    .test0 {
        color: red;
        font: x-large/110% "New Century Schoolbook", serif;
    }
    
    .break {
        color: green
    }
    
    .test1 {
        color: red;
        font: x-large/110% "New Century Schoolbook", serif;
        margin: 10px;
    }
Стало:
    .test0, .test1 {
        color: red;
        font: x-large/110% "New Century Schoolbook",serif
    }
    
    .break {
        color: green
    }
    
    .test1 {
        margin: 10px
    }

### 2.2.3. Управление структурными изменениями

Управление структурными изменениями происходит с помощью комментариев специального содержания.

#### 2.2.3.1. Защита от удаления

Удаление перекрываемых свойств (см. 2.2.1.2) можно запрещать с помощью комментария `/*p*/` перед защищаемым свойством или с помощью пары комментариев `/*p<*/` и `/*>p*/`, между которыми находятся защищаемые свойства.

Комментарий `/*p<*/` защищает все следующие за ним свойства вне зависимости от того, на каком уровне вложенности они находятся. Комментарий `/*>p*/` выключает эту защиту. Любой из этих комментариев может находиться либо между блоками, либо между свойствами.

Было с защитой (с помощью `/*p*/`):
    .test {
        /*p*/color: red;
    }
    
    .test {
        color: green;
    }
Стало с защитой:
    .test {
        color: red; <-- свойство не было перекрыто 'color: green'
        color: green
    }
Стало без защиты:
    .test {
        color: green
    }
Было с защитой (с помощью пары `/*p<*/` и `/*>p*/`):
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
Стало с защитой:
    .test0 {
        color: red;
        color: silver
    }

    .test0, .test1 {
        color: green
    }
Стало без защиты:
    .test0 {
        color: silver
    }
    
    .test1 {
        color: green
    }

#### 2.2.3.2. Защита от смены порядка

В процессе минимизации может произойти смена порядка, в котором следуют свойства. Например, сливаются два блока, которые отличаются лишь порядком свойств.

Смену порядка можно запрещать с помощью комментария `/*o*/` перед защищаемым свойством или с помощью пары комментариев `/*o<*/` и `/*>o*/`, между которыми находятся защищаемые свойства.

Комментарий `/*o<*/` защищает все следующие за ним свойства вне зависимости от того, на каком уровне вложенности они находятся. Комментарий `/*>o*/` выключает эту защиту. Любой из этих комментариев может находиться либо между блоками, либо между свойствами.

Было с защитой (с помощью `/*o*/`):
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
Стало с защитой:
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
Стало без защиты:
    .test0, .test1 {
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box
    }
Было с защитой (с помощью пары `/*o<*/` и `/*>o*/`):
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
Стало с защитой:
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
Стало без защиты:
    .test0, .test1 {
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box
    }

# 3. Рекомендации

С точки зрения минимизации стили можно разделить на две группы: удобные и неудобные. Разница даже в один символ может превратить вполне сокращаемый исходный текст в минимально обрабатываемый.

Если вы хотите помочь минимизатору хорошо выполнить работу, следуйте следующим советам.

## 3.1. Длина селекторов

Чем короче селектор (whitespace не учитываются), тем больше вероятность удачного группирования.

## 3.2. Порядок свойств

Придерживайтесь во всём стиле одного порядка, в котором перечисляются свойства, так вам не потребуется защита от смены порядка. Соответственно, меньше вероятность допустить ошибку и помешать минимизатору излишним управлением.

## 3.3. Расположение схожих блоков

Располагайте блоки со схожим набором свойств как можно ближе друг к другу.

Плохо:
    .test0 {
        color: red
    }
    
    .test1 {
        color: green
    }
    
    .test2 {
        color: red
    }
Результат (53 символа):
    .test0{color:red}.test1{color:green}.test2{color:red}
Хорошо:
    .test1 {
        color: green
    }
    
    .test0 {
        color: red
    }
    
    .test2 {
        color: red
    }
Результат (43 символа):
    .test1{color:green}.test0,.test2{color:red}
