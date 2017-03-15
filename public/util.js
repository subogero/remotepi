/* (C) 2014 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
var util = {};

util.byId = function(id) {
    return document.getElementById(id);
}

util.newEl = function(tag) {
    return document.createElement(tag);
}

util.newTxt = function(text) {
    return document.createTextNode(text);
}

util.appendTxt = function(elem, text) {
    elem.appendChild(util.newTxt(text));
}

util.empty = function(elem) {
    while (1) {
        var first = elem.firstChild;
        if (!first) { break }
        elem.removeChild(first);
    }
    return elem;
}

util.byIdEmpty = function(id) {
    return util.empty(util.byId(id));
}

util.appendOpsButtons = function(elem, callback, item) {
    var ops = item.ops;
    for (var i = 0; i < item.ops.length; i++) {
        var op = item.ops[i];
        if (op == 'cd') { continue; }
        var button = util.newEl('button');
        // Extra function to trap current op, name in closure,
        // otherwise it's the last values in LexicalScope object of loop!
        button.onclick = function(op, name) {
            return function() { callback(op, name) };
        }(op, item.name);
        button.title = op;
        var img = util.newEl('img');
        img.src = 'img/' + (['I','g'].indexOf(op) >= 0 ? 'p' : op) + '.png';
        button.appendChild(img);
        elem.appendChild(button);
    }
}
