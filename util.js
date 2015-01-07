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
                '</button> ';
    }
    return html;
}
