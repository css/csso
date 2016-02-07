//
//            item        item        item        item
//          /------\    /------\    /------\    /------\
//          | data |    | data |    | data |    | data |
//  null <--+-prev |<---+-prev |<---+-prev |<---+-prev |
//          | next-+--->| next-+--->| next-+--->| next-+--> null
//          \------/    \------/    \------/    \------/
//             ^                                    ^
//             |                list                |
//             |              /------\              |
//             \--------------+-head |              |
//                            | tail-+--------------/
//                            \------/
//

var Item = function() {

};

function createItem(data) {
    return {
        data: data,
        next: null,
        prev: null
    };
}

var List = function(values) {
    if (Array.isArray(values)) {
        var cursor = null;

        for (var i = 0; i < values.length; i++) {
            var item = createItem(values[i]);

            if (cursor) {
                cursor.next = item;
            } else {
                this.head = item;
            }

            item.prev = cursor;
            cursor = item;
        }

        this.tail = cursor;
    } else {
        this.head = null;
        this.tail = null;
    }
};

Object.defineProperty(List.prototype, 'size', {
    get: function() {
        var size = 0;
        var cursor = this.head;

        while (cursor) {
            size++;
            cursor = cursor.next;
        }

        return size;
    }
});

List.createItem = createItem;
List.prototype.createItem = createItem;

List.prototype.toArray = function() {
    var cursor = this.head;
    var result = [];

    while (cursor) {
        result.push(cursor.data);
        cursor = cursor.next;
    }

    return result;
};
List.prototype.toJSON = function() {
    return this.toArray();
};

List.prototype.isEmpty = function() {
    return !this.head;
};

List.prototype.first = function() {
    return this.head && this.head.data;
};

List.prototype.last = function() {
    return this.tail && this.tail.data;
};

List.prototype.each = function(fn, context) {
    var cursor = this.head;
    var next;

    while (cursor) {
        next = cursor.next;

        if (cursor.data) {
            var res = fn.call(context || this, cursor.data, cursor);
            if (res) {
                cursor.data = res;
            } else if (res === null) {
                this.remove(cursor);
            }
        }

        cursor = next;
    }
};

List.prototype.eachRight = function(fn, context) {
    var cursor = this.tail;
    var prev;

    while (cursor) {
        prev = cursor.prev;

        if (cursor.data) {
            var res = fn.call(context || this, cursor.data, cursor);
            if (res) {
                cursor.data = res;
            } else if (res === null) {
                this.remove(cursor);
            }
        }

        cursor = prev;
    }
};

List.prototype.insert = function(item, before) {
    if (before) {
        if (!before.prev) {
            // insert to the beginning of list
            if (this.head !== before) {
                throw new Error('before doesn\'t below to list');
            }

            // since head points to before therefore list doesn't empty
            // no need to check tail
            this.head = item;
            before.prev = item;
            item.next = before;
        } else {
            // insert between two items
            before.prev.next = item;
            item.prev = before.prev;

            before.prev = item;
            item.next = before;
        }
    } else {
        // insert to end of the list
        if (this.tail) {
            // if list has a tail, then it also has a head, but head doesn't change

            // last item -> new item
            this.tail.next = item;

            // last item <- new item
            item.prev = this.tail;
        } else {
            // if list has no a tail, then it also has no a head
            // in this case points head to new item
            this.head = item;
        }

        // tail always start point to new item
        this.tail = item;
    }
};

List.prototype.append = function(item) {
    this.insert(item);
};

List.prototype.prepend = function(item) {
    this.insert(item, this.head);
};

List.prototype.remove = function(item) {
    if (item.prev) {
        item.prev.next = item.next;
    } else {
        if (this.head !== item) {
            throw new Error('item doesn\'t below to list');
        }

        this.head = item.next;
    }

    if (item.next) {
        item.next.prev = item.prev;
    } else {
        if (this.tail !== item) {
            throw new Error('item doesn\'t below to list');
        }

        this.tail = item.prev;
    }

    item.data = null;
    // item.prev = null;
    // item.next = null;
};

List.prototype.clear = function() {
    this.head = null;
    this.tail = null;
};

List.prototype.insertList = function(list, before) {
    if (before) {
        if (!before.prev) {
            // insert to the beginning of list
            if (this.head !== before) {
                throw new Error('before doesn\'t below to destination list');
            }

            // since head points to before therefore list doesn't empty
            // no need to check tail
            this.head = list.head;
            before.prev = list.tail;
            list.tail.next = before;
        } else {
            // insert between two items
            before.prev.next = list.head;
            list.head.prev = before.prev;

            before.prev = list.tail;
            list.tail.next = before;
        }
    } else {
        // insert to end of the list
        if (this.tail) {
            // if destination list has a tail, then it also has a head,
            // but head doesn't change

            // dest tail -> source head
            this.tail.next = list.head;

            // dest tail <- source head
            list.head.prev = this.tail;
        } else {
            // if list has no a tail, then it also has no a head
            // in this case points head to new item
            this.head = list.head;
        }

        // tail always start point to new item
        this.tail = list.tail;
    }

    list.head = null;
    list.tail = null;
};

List.prototype.extract = function(from, to) {
    var list = new List();

    if (!from) {
        from = this.head;
    }
    if (!to) {
        to = this.tail;
    }

    if (from) {
        var cursor = from;

        while (cursor && cursor !== to) {
            cursor = cursor.next;
        }

        if (!cursor) {
            throw new Error('from and to are not connected (not in one list)');
        }

        if (from.prev) {
            from.prev.next = to.next;
        } else {
            this.head = to.next;
        }

        if (to.next) {
            to.next.prev = from.prev;
        } else {
            this.tail = from.prev;
        }

        from.prev = null;
        to.next = null;
        list.head = from;
        list.tail = to;
    }

    return list;
};

module.exports = List;
