# 1. Описание

CSSO (CSS Optimizer) является минимизатором CSS, выполняющим как минимизацию без изменения структуры, так и структурную минимизацию с целью получить как можно меньший текст.

Этот документ является инструкцией по установке и использованию. Если вам нужна детальная инструкция по минимизации, она находится [здесь](https://github.com/afelix/csso/blob/master/MANUAL.ru.md).

Замеченные ошибки лучше добавлять в [Issues](https://github.com/afelix/csso/issues) проекта.

Советы, предложения, отзывы, а также ошибки, которые почему-то лучше выслать письмом, высылайте на адрес <skryzhanovsky@ya.ru>.

# 2. Установка

## 2.1. Предварительные требования

* для использования из браузера: любая OS с современным браузером
* для использования из командной строки: OS Linux / Mac OS X / любая OS с работающим Node.js

## 2.2. Установка с помощью git

Предварительные требования:

* git&nbsp;— [http://git-scm.com/](http://git-scm.com/)

Установка:

* выполнить `git clone git://github.com/afelix/csso.git`

## 2.3. Установка с помощью npm

Предварительные требования:

* nodejs версии 0.4.x&nbsp;— [http://nodejs.org](http://nodejs.org)
* npm&nbsp;— [http://github.com/isaacs/npm/](http://github.com/isaacs/npm/)

Установка:

* выполнить `npm install csso`

Обновление:

* выполнить `npm update csso`

Удаление:

* выполнить `npm uninstall csso`

# 3. Использование

## 3.1. Через браузер (при установке с помощью git)

Открыть в браузере файл `web/csso.html` или [http://afelix.github.com/csso/csso.html](http://afelix.github.com/csso/csso.html).

**Работа CSSO в браузерах не гарантирована. Рекомендуемый путь использования этой утилиты&nbsp;— использование из командной строки или npm-модулей.**

## 3.2. Через npm-модуль (при установке с помощью npm)

Пример (`test.js`):

    var csso = require('csso'),
        css = '.test, .test { color: rgb(255, 255, 255) }';

    console.log(csso.justDoIt(css));
Вывод (`> node test.js`):

    .test{color:#fff}
Используйте `csso.justDoIt(css, true)`, если требуется выключить структурную минимизацию.

## 3.3. Через командную строку

При git-установке запускать `bin/csso`, но в таком случае потребуется nodejs версии 0.4.x&nbsp;— [http://nodejs.org](http://nodejs.org)

При npm-установке запускать `csso`.

Справка командной строки:

    csso
        показывает этот текст
    csso <имя_файла>
        минимизирует CSS из <имя_файла> и записывает результат в stdout
    csso <in_имя_файла> <out_имя_файла>
    csso -i <in_имя_файла> -o <out_имя_файла>
    csso --input <in_имя_файла> --output <out_имя_файла>
        минимизирует CSS из <in_имя_файла> и записывает результат в <out_имя_файла>
    csso -off
    csso --restructure-off
        turns structure minimization off
    csso -h
    csso --help
        показывает этот текст
    csso -v
    csso --version
        показывает номер версии CSSO

Пример использования:

    $ echo ".test { color: red; color: green }" > test.css
    $ csso test.css
    .test{color:green}

# 4. Минимизация (кратко)

Минимизация без изменения структуры:

* Удаление whitespace
* Удаление концевых `;`
* Удаление комментариев
* Удаление неправильных `@charset` и `@import`
* Удаление кавычек из строк в селекторе атрибута
* Минимизация цвета
* Минимизация `0`
* Слияние многострочных строк в однострочные
* Минимизация `font-weight`

Минимизация с изменением структуры:

* Слияние блоков с одинаковыми селекторами
* Слияние блоков с одинаковыми свойствами
* Удаление перекрываемых свойств
* Удаление перекрываемых shorthand-свойств
* Удаление повторяющихся селекторов
* Частичное слияние блоков
* Частичное разделение блоков
* Удаление пустых ruleset и at-rule
* Минимизация `margin` и `padding`

Детальное описание минимизации находится [здесь](https://github.com/afelix/csso/blob/master/MANUAL.ru.md).

# 5. Авторы

* идея и поддержка&nbsp;— Виталий Харисов (<vitaly@harisov.name>)
* реализация&nbsp;— Сергей Крыжановский (<skryzhanovsky@ya.ru>)
* перевод на английский язык&nbsp;— Leonid Khachaturov (leonidkhachaturov@gmail.com)

# 6. Остальное

* CSSO распространяется под [лицензией MIT](https://github.com/afelix/csso/blob/master/MIT-LICENSE.txt)
