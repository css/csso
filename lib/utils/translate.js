var useInfo;
var buffer;
var typeHandlers = {
    unary: simple,
    nth: simple,
    combinator: simple,
    ident: simple,
    number: simple,
    s: simple,
    string: simple,
    attrselector: simple,
    operator: simple,
    raw: simple,
    unknown: simple,
    attribFlags: simple,

    simpleselector: composite,
    dimension: composite,
    selector: composite,
    property: composite,
    value: composite,
    filterv: composite,
    progid: composite,
    ruleset: composite,
    atruleb: composite,
    atrulerq: composite,
    atrulers: composite,
    stylesheet: composite,

    percentage: percentage,
    comment: comment,
    clazz: clazz,
    atkeyword: atkeyword,
    shash: shash,
    vhash: vhash,
    attrib: attrib,
    important: important,
    nthselector: nthselector,
    funktion: funktion,
    declaration: declaration,
    filter: filter,
    block: block,
    braces: braces,
    atrules: atrules,
    atruler: atruler,
    pseudoe: pseudoe,
    pseudoc: pseudoc,
    uri: uri,
    functionExpression: functionExpression,

    decldelim: function() {
        buffer.push(';');
    },
    delim: function() {
        buffer.push(',');
    }
};

function simple(token) {
    buffer.push(token[useInfo + 1]);
}

function composite(token) {
    for (var i = useInfo + 1; i < token.length; i++) {
        translate(token[i]);
    }
}

function compositeFrom(token, i) {
    for (; i < token.length; i++) {
        translate(token[i]);
    }
}

function percentage(token) {
    translate(token[useInfo + 1]);
    buffer.push('%');
}

function comment(token) {
    buffer.push('/*', token[useInfo + 1], '*/');
}

function clazz(token) {
    buffer.push('.');
    translate(token[useInfo + 1]);
}

function atkeyword(token) {
    buffer.push('@');
    translate(token[useInfo + 1]);
}

function shash(token) {
    buffer.push('#', token[useInfo + 1]);
}

function vhash(token) {
    buffer.push('#', token[useInfo + 1]);
}

function attrib(token) {
    buffer.push('[');
    composite(token);
    buffer.push(']');
}

function important(token) {
    buffer.push('!');
    composite(token);
    buffer.push('important');
}

function nthselector(token) {
    buffer.push(':');
    simple(token[useInfo + 1]);
    buffer.push('(');
    compositeFrom(token, useInfo + 2);
    buffer.push(')');
}

function funktion(token) {
    simple(token[useInfo + 1]);
    buffer.push('(');
    composite(token[useInfo + 2]);
    buffer.push(')');
}

function declaration(token) {
    translate(token[useInfo + 1]);
    buffer.push(':');
    translate(token[useInfo + 2]);
}

function filter(token) {
    translate(token[useInfo + 1]);
    buffer.push(':');
    translate(token[useInfo + 2]);
}

function block(token) {
    buffer.push('{');
    composite(token);
    buffer.push('}');
}

function braces(token) {
    buffer.push(token[useInfo + 1]);
    compositeFrom(token, useInfo + 3);
    buffer.push(token[useInfo + 2]);
}

function atrules(token) {
    composite(token);
    buffer.push(';');
}

function atruler(token) {
    translate(token[useInfo + 1]);
    translate(token[useInfo + 2]);
    buffer.push('{');
    translate(token[useInfo + 3]);
    buffer.push('}');
}

function pseudoe(token) {
    buffer.push('::');
    translate(token[useInfo + 1]);
}

function pseudoc(token) {
    buffer.push(':');
    translate(token[useInfo + 1]);
}

function uri(token) {
    buffer.push('url(');
    composite(token);
    buffer.push(')');
}

function functionExpression(token) {
    buffer.push('expression(', token[useInfo + 1], ')');
}

function translate(token) {
    typeHandlers[token[useInfo]](token);
}

module.exports = function(tree, hasInfo) {
    useInfo = hasInfo ? 1 : 0;
    buffer = [];

    translate(tree);

    return buffer.join('');
};
