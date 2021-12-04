import { fork, string, url, tokenTypes as TYPE } from 'css-tree';

function encodeString(value) {
    const stringApostrophe = string.encode(value, true);
    const stringQuote = string.encode(value);

    return stringApostrophe.length < stringQuote.length
        ? stringApostrophe
        : stringQuote;
}

export default fork({
    node: {
        String: {
            generate(node) {
                this.token(TYPE.String, encodeString(node.value));
            }
        },
        Url: {
            generate(node) {
                const encodedUrl = url.encode(node.value);
                const string = encodeString(node.value);

                this.token(TYPE.Url, encodedUrl.length <= string.length + 5 ? encodedUrl : 'url(' + string + ')');
            }
        }
    }
});
