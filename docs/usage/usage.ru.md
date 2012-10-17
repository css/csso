# Через браузер

Открыть в браузере [http://css.github.com/csso/csso.html](http://css.github.com/csso/csso.html).

**Работа CSSO в браузерах не гарантирована. Рекомендуемый путь использования этой утилиты&nbsp;— использование из командной строки или npm-модулей.**

# Через командную строку

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

# Через npm-модуль (при установке с помощью npm)

Пример (`test.js`):
```js
    var csso = require('csso'),
        css = '.test, .test { color: rgb(255, 255, 255) }';

    console.log(csso.justDoIt(css));
```
Вывод (`> node test.js`):
```css
    .test{color:#fff}
```
Используйте `csso.justDoIt(css, true)`, если требуется выключить структурную минимизацию.

