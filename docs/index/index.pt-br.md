CSSO (CSS Otimizador) é um otimizador de CSS diferente dos outros. Além das técnicas de minificação habituais ele pode executar a otimização estrutural de arquivos CSS, resultando em arquivos menores se comparado com outros minificadores.

## Minificação (em poucas palavras)

Transformações seguras:

* Remoção de espaços em branco
* Remoção de ponto e vírgulas `;` ao final do conjunto de regras
* Remoção de comentários
* Remoção de declarações de `@charset` e `@import` inválidas
* Minificação de propriedades de cores
* Minificação de `0`
* Minificação de strings de múltiplas linhas
* Minificação da propriedade `font-weight`

Otimizações estruturais:

* Mesclando blocos com seletores idênticos
* Mesclando blocos com propriedades idênticas
* Remoção de propriedades sobrescritas
* Remoção de propriedades abreviadas sobrescritas
* Remoção de seletores repetidos
* Mescla parcial de blocos
* Divisão parcial de blocos
* Remoção do conjunto de regras e [@regras](https://developer.mozilla.org/pt-BR/docs/Web/CSS/At-rule) vazias
* Minificação das propriedades `margin` e `padding`

As técnicas de minificação são descritas em detalhes em [descrição detalhada](../description/description.pt-br.md).

## Autores

* Ideia inicial&nbsp;— Vitaly Harisov (<vitaly@harisov.name>)
* Implementação&nbsp;— Sergey Kryzhanovsky (<skryzhanovsky@ya.ru>)
* Tradução Inglês&nbsp;— Leonid Khachaturov (<leonidkhachaturov@gmail.com>)
* Tradução Japonês&nbsp;— Koji Ishimoto (<ijok.ijok@gmail.com>)
* Tradução Coreano&nbsp;— Wankyu Kim (<wankyu19@gmail.com>)
* Tradução Português&nbsp;— Ademílson F. Tonato (<ademilsonft@outlook.com>)

## Comentários

Por favor, reporte problemas no [Github](https://github.com/css/csso/issues).

Para comentários, sugestões, etc. Escreva para <skryzhanovsky@ya.ru>.

## Licença

* CSSO é licenciado por [MIT](https://github.com/css/csso/blob/master/MIT-LICENSE.txt)
