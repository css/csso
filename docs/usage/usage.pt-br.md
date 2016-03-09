## No navegador

Use a [versão online do CSSO](http://css.github.com/csso/csso.html) para minimizar seu código.

**CSSO não é garantido que funcione em navegadores. É preferível usar essa ferramenta é executando-a a partir da linha de comando ou através de módulos NPM.**

## A partir da linha de comando

Execute `bin/csso` (quando instalado a partir do git), [NodeJS](http://nodejs.org) 0.8.x é necessário.

Execute `csso` (quando instalado a partir do npm).

Uso:

    csso
        exibe informações de uso
    csso <filename>
        minimiza o CSS em <filename> e gera o resultado no stdout (saída padrão)
    csso <in_filename> <out_filename>
    csso -i <in_filename> -o <out_filename>
    csso --input <in_filename> --output <out_filename>
        minimiza o CSS de entrada <in_filename> e exibe o resultado em <out_filename>
    csso -off
    csso --restructure-off
        desliga a opção de minificação estrutural
    csso -h
    csso --help
        exibe informações de uso
    csso -v
    csso --version
        exibe o número da versão

Exemplo:

    $ echo ".test { color: red; color: green }" > test.css
    $ csso test.css
    .test{color:green}

## Como módulo NPM

Exemplo (`test.js`):
```js
    var csso = require('csso'),
        css = '.test, .test { color: rgb(255, 255, 255) }';

    console.log(csso.justDoIt(css));
```
Saída (`> node test.js`):
```css
    .test{color:#fff}
```
Use `csso.justDoIt(css, true)` para desligar a opção de minificação estrutural.
