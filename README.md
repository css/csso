# Использование

Пока наиболее удобно так:

* git clone git@github.com:afelix/csso.git
* открыть в браузере файл csso.html
* проверять

Неудобно:

* git clone git@github.com:afelix/csso.git
* node ccli.js файл.css
* в ccli.js раскомментировать нужный формат вывода и комментировать ненужный

# Done

### Мелкое

* убирает лишние whitespace;
* убирает комментарии;
* убирает лишние ';';
* убирает неправильный @charset;
* убирает пустые блоки;
* оптимизирует цвет;
* оптимизирует числа;
* склеивает margin и padding;
* склеивает multiline строки;
* font-weight normal и bold => 400 и 700;
* не трогает expression.

### Крупное

* убирает всё, что не попадает в computed stylesheet;
* группирует selector и property в структуры с меньшей длиной в символах;
* порядок, в котором следуют оригинальные selector, сохраняется;
* позволяет комментариями управлять обработкой.

# TODO

### Мелкое

* более удобный command-line;
* документировать код.

### Крупное

* добавить возможность глобального управления обработкой;
* невалидный CSS?
* мануал.

# Описание

TODO

# Установка

TODO

# Использование

TODO

# Минимизация

TODO

## Минимизация без изменения структуры

TODO

### Удаление whitespace

TODO

Было:
    .test
    {
        margin-top: 1em;
        
        margin-left  : 2em;
    }
Стало:
    .test{margin-top:1em;margin-left:2em}
Для большего удобства чтения текст остальных примеров приводится с пробелами (переводом строки и т.п.).

### Удаление лишних `;`

TODO

Было:
    .test {
        margin-top: 1em;;;
        ;;
    }
Стало:
    .test {
        margin-top: 1em
    }

#### Удаление комментариев

TODO

Было:
    /* comment */

    .test /* comment */ {
        /* comment */ margin-top: /* comment */ 1em;
    }
Стало:
    .test {
        margin-top: 1em
    }

## Удаление неправильного @charset

TODO

Было:
    @charset 'UTF-8';
    @charset 'ISO-8859-15';
Стало:
    @charset 'UTF-8'

### Удаление пустых элементов стиля

TODO

Было:
    TODO
Стало:
    TODO

### Оптимизация цвета

TODO

Было:
    .test0 {
        color: yellow;
        border-color: #c0c0c0;
        background: #ffffff;
        border-top-color: #f00;
        outline-color: rgb(0, 0, 0);
    }
Стало:
    .test0 {
        color: #ff0;
        border-color: silver;
        background: #fff;
        border-top-color: red;
        outline-color: #000;
    }

### Оптимизация числовых значений

TODO

Было:
    TODO
Стало:
    TODO

### Оптимизация margin и padding

TODO

Было:
    TODO
Стало:
    TODO

### Склеивание многострочных строк в однострочные

TODO

Было:
    TODO
Стало:
    TODO

### Оптимизация `font-weight`

TODO

Было:
    TODO
Стало:
    TODO

## Минимизация с изменением структуры

TODO

### Расчёт стиля

TODO

### Группировка

TODO

### Управление структурными изменениями

TODO
