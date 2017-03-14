/* (C) 2014 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
var util = {};

util.ops_buttons_dom = function(callback, elem) {
    var buttons = [];
    var ops = elem.ops;
    for (var i = 0; i < elem.ops.length; i++) {
        var op = elem.ops[i];
        if (op == 'cd') { continue; }
        var button = document.createElement('button');
        // Extra function to trap current op, name in closure,
        // otherwise it's the last values in LexicalScope object of loop!
        button.onclick = function(op, name) {
            return function() { callback(op, name) };
        }(op, elem.name);
        button.title = op;
        var img = document.createElement('img');
        img.src = 'img/' + (['I','g'].indexOf(op) >= 0 ? 'p' : op) + '.png';
        button.appendChild(img);
        buttons.push(button);
    }
    return buttons;
}
