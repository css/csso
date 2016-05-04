CSSO (CSS Otimizador) é um otimizador de CSS diferente dos outros. Além das técnicas de minificação habituais ele pode executar a otimização estrutural de arquivos CSS, resultando em arquivos menores se comparado com outros minificadores.

## Minificação

Minificação é um processo de transformação de um documento CSS em um documento menor sem perdas. As estratégias típicas para alcançar estes objetivos são:

* transformações básicas, tais como remoção de elementos desnecessários (ex. ponto e vírgulas) ou transformação de valores em sua representação mais compacta (ex. `0px` para `0`);
* otimizações estruturais, tais como a remoção de propriedades sobrescritas ou mescla de blocos.

### Transformações básicas

#### Remoção de espaço em branco

Em alguns casos, espaços em branco (` `, `\n`, `\r`, `\t`, `\f`) são desnecessários e não afetam a renderização.

* Antes:
```css
        .test
        {
            margin-top: 1em;

            margin-left  : 2em;
        }
```

* Depois:
```css
        .test{margin-top:1em;margin-left:2em}
```

Os exemplos seguintes são fornecido com um espaço em branco deixado intacto para melhor legibilidade.

#### Remoção de ponto e vírgula ';'

O último ponto e vírgula de um bloco não é necessário e não afeta a renderização.

* Antes:
```css
        .test {
            margin-top: 1em;;
        }
```

* Depois:
```css
        .test {
            margin-top: 1em
        }
```

#### Remoção de comentários

Comentários não afetam a renderização: \[[CSS 2.1 / 4.1.9 Comments](http://www.w3.org/TR/CSS21/syndata.html#comments)\].

* Antes:
```css
        /* comment */

        .test /* comment */ {
            /* comment */ margin-top: /* comment */ 1em;
        }
```

* Depois:
```css
        .test {
            margin-top: 1em
        }
```

Se você quer salvar o comentário, CSSO pode fazer isso com apenas um caracter no começo do comentário `!`.

* Antes:
```css
        /*! MIT license */
        /*! will be removed */

        .test {
            color: red
        }
```

* Depois:
```css
        /*! MIT license */
        .test {
            color: red
        }
```

#### Remoção de declarações de `@charset` e `@import` inválidas

De acordo com a especificação, `@charset` deve ser colocado no início da folha de estilo: \[[CSS 2.1 / 4.4 CSS style sheet representation](http://www.w3.org/TR/CSS21/syndata.html#charset)\].

CSSO lida com esta regra de forma um pouco descontraída - nós mantemos a regra do `@charset` que segue imediatamente espaços em branco e comentários no início da folha de estilo.

Regras de `@import` declaradas incorretamente são deletadas de acordo com \[[CSS 2.1 / 6.3 The @import rule](http://www.w3.org/TR/CSS21/cascade.html#at-import)\].

* Antes:
```css
        /* comment */
        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        @charset 'wrong';

        h1 {
            color: red
        }

        @import "wrong";
```

* Depois:
```css
        @charset 'UTF-8';
        @import "test0.css";
        @import "test1.css";
        h1 {
            color: red
        }
```

#### Minificação de propriedades de cores

Alguns valores de cores são minificados de acordo com \[[CSS 2.1 / 4.3.6 Colors](http://www.w3.org/TR/CSS21/syndata.html#color-units)\].

* Antes:
```css
        .test {
            color: yellow;
            border-color: #c0c0c0;
            background: #ffffff;
            border-top-color: #f00;
            outline-color: rgb(0, 0, 0);
        }
```

* Depois:
```css
        .test {
            color: #ff0;
            border-color: silver;
            background: #fff;
            border-top-color: red;
            outline-color: #000
        }
```

#### Minificação de 0

Em alguns casos, o valor numérico pode ser compactado para 0` ou até mesmo removido.

O valor `0%` não está sendo compactado para evitar a seguinte situação: `rgb(100%, 100%, 0)`.

* Antes:
```css
        .test {
            fakeprop: .0 0. 0.0 000 00.00 0px 0.1 0.1em 0.000em 00% 00.00% 010.00
        }
```

* Depois:
```css
        .test {
            fakeprop: 0 0 0 0 0 0 .1 .1em 0 0% 0% 10
        }
```

#### Minificação de strings de multiplas linhas

Strings de multiplas linhas são minificadas de acordo com \[[CSS 2.1 / 4.3.7 Strings](http://www.w3.org/TR/CSS21/syndata.html#strings)\].

* Antes:
```css
        .test[title="abc\
        def"] {
            background: url("foo/\
        bar")
        }
```

* Depois:
```css
        .test[title="abcdef"] {
            background: url("foo/bar")
        }
```

#### Minificação da propriedade font-weight

Os valores `bold` e `normal` da propriedade `font-weight` são minificados de acordo com \[[CSS 2.1 / 15.6 Font boldness: the 'font-weight' property](http://www.w3.org/TR/CSS21/fonts.html#font-boldness)\].

* Antes:
```css
        .test0 {
            font-weight: bold
        }

        .test1 {
            font-weight: normal
        }
```

* Depois:
```css
        .test0 {
            font-weight: 700
        }

        .test1 {
            font-weight: 400
        }
```

### Otimizações estruturais

#### Mesclando blocos com seletores idênticos

Blocos adjacentes com seletores idênticos são mesclados.

* Antes:
```css
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
```

* Depois:
```css
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
```

#### Mesclando blocos com propriedades idênticas

Blocos adjacentes com propriedades idênticas são mesclados.

* Antes:
```css
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
```

* Depois:
```css
        .test0 {
            margin: 0
        }

        .test1, .test2 {
            border: none
        }

        .test0 {
            padding: 0
        }
```

#### Remoção de propriedades sobrescritas

Propriedades ignoradas pelo navegador podem ser removidas usando as seguintes regras:

* a última propriedade de uma regra CSS é aplicada, se nenhuma das propriedades têm uma declaração de `!important`;
* entre as propriedades com `!important`, a última é aplicada.

* Antes:
```css
        .test {
            color: red;
            margin: 0;
            line-height: 3cm;
            color: green;
        }
```

* Depois:
```css
        .test {
            margin: 0;
            line-height: 3cm;
            color: green
        }
```

##### Remoção de propriedades abreviadas sobrescritas

No caso das propriedades `border`, `margin`, `padding`, `font` and `list-style`, a seguinte regra de remoção será aplicada: se a última propriedade é um 'geral' (por exemplo, `border`), então todas as propriedades anteriores sobrescritas serão removidas (por exemplo, `border-top-width` or `border-style`).

* Antes:
```css
        .test {
            border-top-color: red;
            border-color: green
        }
```

* Depois:
```css
        .test {
            border-color:green
        }
```

#### Remoção de seletores repetidos

Seletores repetidos podem ser removidos.

* Antes:
```css
        .test, .test {
            color: red
        }
```

* Depois:
```css
        .test {
            color: red
        }
```

#### Mescla parcial de blocos

Dados dois blocos adjacentes em que um dos blocos é um subconjunto do outro, a seguinte otimização é possível:

* Propriedades sobrepostas são removidas do bloco de origem;
* as propriedades restantes do bloco de origem são copiadas para um bloco de recepção.

As minificações acontecerão se a quantidade de caracteres das propriedades que serão copiadas for menor do que a de caracteres das propriedades que se sobrepõem.

* Antes:
```css
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
```

* Depois:
```css
        .test0, .test1 {
            color: red
        }

        .test1, .test2 {
            border: none
        }
```

As minificações não ocorrerão se a contagem de caracteres das propriedades a serem copiadas for maior do que a contagem de caracteres das propriedades que se sobrepõem.

* Antes:
```css
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
```

* Depois:
```css
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
```

#### Divisão parcial de blocos

Se dois blocos adjacentes contêm propriedades de intersecção a seguinte otimização é possível:

* a intersecção de propriedade é determinada;
* um novo bloco contendo a intersecção é criado entre os dois blocos.

A minificação ocorrerá se houver ganho na contagem de caracteres.

* Antes:
```css
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
```

* Depois:
```css
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
```

A minificação não ocorrerá se não houver ganho na contagem de caracteres.

* Antes:
```css
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
```

* Depois:
```css
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
```

#### Remoção do conjunto de regras e [@regras](https://developer.mozilla.org/pt-BR/docs/Web/CSS/At-rule) vazias.

O conjunto de regras vazias e regras at-rule serão removidos.

* Antes:
```css
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
```

* Depois:
```css
        .test{color:red;border:none}
```

#### Minificação das pripriedades margin e padding

As propriedades `margin` e `padding` são minifcados de acordo com \[[CSS 2.1 / 8.3 Margin properties](http://www.w3.org/TR/CSS21/box.html#margin-properties)\] e \[[CSS 2.1 / 8.4 Padding properties](http://www.w3.org/TR/CSS21/box.html#padding-properties)\].

* Antes:
```css
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
```

* Depois:
```css
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
```

## Recomendações

Algumas folhas de estilos comprimem melhor do que outras. Às vezes uma diferença de caractere pode tornar uma folha de estilo bem compreensível em uma muito inconveniente.

Você pode ajudar o minificador seguindo estas recomendações.

### Comprimento de seletores

Seletores mais curtos são mais fáceis de reagrupar.

### Ordem das propriedades

Atenha-se a mesma ordem de propriedades em toda a folha de estilo - isso permitirá que você não use as expressões. Quanto menos intervenção manual existir, mais fácil será para o minificador trabalhar de forma otimizada.

### Posicionamento de blocos semelhantes

Manter blocos com conjuntos de propriedades similares próximos uns dos outros.

Mau:

* Antes:
```css
        .test0 {
            color: red
        }

        .test1 {
            color: green
        }

        .test2 {
            color: red
        }
```

* Depois (53 caracteres):
```css
        .test0{color:red}.test1{color:green}.test2{color:red}
```

Bom:

* Antes:
```css
        .test1 {
            color: green
        }

        .test0 {
            color: red
        }

        .test2 {
            color: red
        }
```

* Depois (43 caracteres):
```css
        .test1{color:green}.test0,.test2{color:red}
```

### Usando !important

Não é preciso dizer que o uso da declaração `!important` prejudica o desempenho da minificação.

Mau:

* Antes:
```css
        .test {
            margin-left: 2px !important;
            margin: 1px;
        }
```

* Depois (43 caracteres):
```css
        .test{margin-left:2px!important;margin:1px}
```

Bom:

* Antes:
```css
        .test {
            margin-left: 2px;
            margin: 1px;
        }
```

* Depois (17 caracteres):
```css
        .test{margin:1px}
```
