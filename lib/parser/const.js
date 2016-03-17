exports.TokenType = {
    String: 'String',
    Comment: 'Comment',
    Unknown: 'Unknown',
    Newline: 'Newline',
    Space: 'Space',
    Tab: 'Tab',
    ExclamationMark: 'ExclamationMark',         // !
    QuotationMark: 'QuotationMark',             // "
    NumberSign: 'NumberSign',                   // #
    DollarSign: 'DollarSign',                   // $
    PercentSign: 'PercentSign',                 // %
    Ampersand: 'Ampersand',                     // &
    Apostrophe: 'Apostrophe',                   // '
    LeftParenthesis: 'LeftParenthesis',         // (
    RightParenthesis: 'RightParenthesis',       // )
    Asterisk: 'Asterisk',                       // *
    PlusSign: 'PlusSign',                       // +
    Comma: 'Comma',                             // ,
    HyphenMinus: 'HyphenMinus',                 // -
    FullStop: 'FullStop',                       // .
    Solidus: 'Solidus',                         // /
    Colon: 'Colon',                             // :
    Semicolon: 'Semicolon',                     // ;
    LessThanSign: 'LessThanSign',               // <
    EqualsSign: 'EqualsSign',                   // =
    GreaterThanSign: 'GreaterThanSign',         // >
    QuestionMark: 'QuestionMark',               // ?
    CommercialAt: 'CommercialAt',               // @
    LeftSquareBracket: 'LeftSquareBracket',     // [
    ReverseSolidus: 'ReverseSolidus',           // \
    RightSquareBracket: 'RightSquareBracket',   // ]
    CircumflexAccent: 'CircumflexAccent',       // ^
    LowLine: 'LowLine',                         // _
    LeftCurlyBracket: 'LeftCurlyBracket',       // {
    VerticalLine: 'VerticalLine',               // |
    RightCurlyBracket: 'RightCurlyBracket',     // }
    Tilde: 'Tilde',                             // ~
    Identifier: 'Identifier',
    DecimalNumber: 'DecimalNumber'
};

// var i = 1;
// for (var key in exports.TokenType) {
//     exports.TokenType[key] = i++;
// }

exports.NodeType = {
    AtkeywordType: 'atkeyword',
    AtrulebType: 'atruleb',
    AtrulerqType: 'atrulerq',
    AtrulersType: 'atrulers',
    AtrulerType: 'atruler',
    AtrulesType: 'atrules',
    AttribType: 'attrib',
    AttrselectorType: 'attrselector',
    BlockType: 'block',
    BracesType: 'braces',
    ClassType: 'clazz',
    CombinatorType: 'combinator',
    CommentType: 'comment',
    DeclarationType: 'declaration',
    DecldelimType: 'decldelim',
    DelimType: 'delim',
    DimensionType: 'dimension',
    FilterType: 'filter',
    FiltervType: 'filterv',
    FunctionBodyType: 'functionBody',
    FunctionExpressionType: 'functionExpression',
    FunctionType: 'funktion',
    IdentType: 'ident',
    ImportantType: 'important',
    NamespaceType: 'namespace',
    NthselectorType: 'nthselector',
    NthType: 'nth',
    NumberType: 'number',
    OperatorType: 'operator',
    PercentageType: 'percentage',
    ProgidType: 'progid',
    PropertyType: 'property',
    PseudocType: 'pseudoc',
    PseudoeType: 'pseudoe',
    RawType: 'raw',
    RulesetType: 'ruleset',
    SelectorType: 'selector',
    ShashType: 'shash',
    SimpleselectorType: 'simpleselector',
    StringType: 'string',
    StylesheetType: 'stylesheet',
    SType: 's',
    UnaryType: 'unary',
    UnknownType: 'unknown',
    UriType: 'uri',
    ValueType: 'value',
    VhashType: 'vhash'
};
