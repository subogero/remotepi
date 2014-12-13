rpifm = {};
rpifm.cmds = "";

rpifm.sendcmds = function() {
    document.getElementById("fm").innerHTML = "Waiting for rpi.fm...";
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            rpifm.fm2html(JSON.parse(req.responseText));
        }
    }
    req.open("GET", "fm/" + this.cmds, true);
    req.send();
}

rpifm.fm2html = function(fm) {
    var html = '';
    for (i = 0; i < fm.length; i++) {
        var c = i % 2 ? 'odd' : 'even';
        var name = fm[i].label ? fm[i].label : fm[i].name;
        html += '<p class="' + c + '">';
        var style = '';
        if (fm[i].ops.indexOf('cd') != -1) {
            html += '<a href="javascript:void(0)" ' +
                    'onclick="rpifm.addcmd(&quot;' + fm[i].name + '&quot;);">' +
                    name + '</a></p>';
            style = ' style="text-align:right"';
        } else {
            html += name + '</p>';
        }
        var ops = fm[i].ops;
        if (ops.length <= 1) {
            continue;
        }
        html += '<p class="' + c + '"' + style + '>';
        for (op = 0; op < ops.length; op++) {
            if (ops[op] == 'cd') {
                continue;
            }
            html += '<button onclick="rpifm.lastcmd(' +
                    '&quot;' + fm[i].name + '&quot;,' +
                    '&quot;' + ops[op] + '&quot;)" ' +
                    'title="' + ops[op] + '">' + ops[op] + '</button> ';
        }
        html += '</p>';
    }
    document.getElementById("fm").innerHTML = html;
}

// Send one rpi.fm command
rpifm.cmd = function(command) {
    this.cmds = (command + "/");
    this.sendcmds();
}

// Append rpi.fm command to list, send all
rpifm.addcmd = function() {
    for (var i = 0; i < arguments.length; i++) {
        var cmd = arguments[i];
        if (cmd.search(/^\//) != -1) {
            cmd = cmd.replace(/^\//, '');
            this.cmds = '';
        }
        this.cmds += (cmd + "/");
    }
    this.sendcmds();
}

// Append rpi.fm command to list, send all, then clear list
rpifm.lastcmd = function() {
    for (var i = 0; i < arguments.length; i++) {
        this.cmds += (arguments[i] + "/");
    }
    this.sendcmds();
    this.cmds = "";
}
