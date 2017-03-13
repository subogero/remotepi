/* (C) 2014 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
var util = {};
util.ops_buttons = function(callback, elem) {
    var html = '';
    var ops = elem.ops;
    for (var op = 0; op < ops.length; op++) {
        if (ops[op] == 'cd') {
            continue;
        }
        var img = ops[op] == 'I' ? 'p.png'
                : ops[op] == 'g' ? 'p.png'
                :                  ops[op] + '.png';
        html += '<button onclick="' +
                callback + '(&quot;' + ops[op] + '&quot;,' +
                '&quot;' + elem.name + '&quot;)" ' +
                'title="' + ops[op] + '">' +
                '<img src="img/' + img + '" alt="' + ops[op] + '">' +
                '</button>';
    }
    return html;
}

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
