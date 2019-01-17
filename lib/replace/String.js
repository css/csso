module.exports = node => {
    let { value } = node;

    // remove escaped newlines, i.e.
    // .a { content: "foo\
    // bar"}
    // ->
    // .a { content: "foobar" }
    value = value.replace(/\\(\r\n|\r|\n|\f)/g, '');

    node.value = value;
};
