# Debugging

## CLI

All debug information outputs to `stderr`.

To get brief info about compression use `--stat` option.

```
> echo '.test { color: #ff0000 }' | csso --stat >/dev/null
File:       <stdin>
Original:   25 bytes
Compressed: 16 bytes (64.00%)
Saving:     9 bytes (36.00%)
Time:       12 ms
Memory:     0.346 MB
```

To get details about compression steps use `--debug` option.

```
> echo '.test { color: green; color: #ff0000 } .foo { color: red }' | csso --debug
## parsing done in 10 ms

Compress block #1
(0.002ms) convertToInternal
(0.000ms) clean
(0.001ms) compress
(0.002ms) prepare
(0.000ms) initialRejoinRuleset
(0.000ms) rejoinAtrule
(0.000ms) disjoin
(0.000ms) buildMaps
(0.000ms) markShorthands
(0.000ms) processShorthand
(0.001ms) restructBlock
(0.000ms) rejoinRuleset
(0.000ms) restructRuleset
## compressing done in 9 ms

.foo,.test{color:red}
```

More details are provided when `--debug` flag has a number greater than `1`:

```
> echo '.test { color: green; color: #ff0000 } .foo { color: red }' | csso --debug 2
## parsing done in 8 ms

Compress block #1
(0.000ms) clean
  .test{color:green;color:#ff0000}.foo{color:red}

(0.001ms) compress
  .test{color:green;color:red}.foo{color:red}

...

(0.002ms) restructBlock
  .test{color:red}.foo{color:red}

(0.001ms) rejoinRuleset
  .foo,.test{color:red}

## compressing done in 13 ms

.foo,.test{color:red}
```

Using `--debug` option adds stack trace to CSS parse error output. That can help to find out problem in parser.

```
> echo '.a { color }' | csso --debug

Parse error <stdin>: Colon is expected
    1 |.a { color }
------------------^
    2 |

/usr/local/lib/node_modules/csso/lib/cli.js:243
                throw e;
                ^

Error: Colon is expected
    at parseError (/usr/local/lib/node_modules/csso/lib/parser/index.js:54:17)
    at eat (/usr/local/lib/node_modules/csso/lib/parser/index.js:88:5)
    at getDeclaration (/usr/local/lib/node_modules/csso/lib/parser/index.js:394:5)
    at getBlock (/usr/local/lib/node_modules/csso/lib/parser/index.js:380:27)
    ...
```

## API

[TODO]
