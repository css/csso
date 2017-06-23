module.exports = function Dimension(node) {
    // 1UNIT -> 1unit
    node.unit = node.unit.toLowerCase();
};
