rpifm = {};
rpifm.cmds = "";

rpifm.sendcmds = function() {
    document.getElementById("statusbar").innerHTML = "Waiting for rpi.fm...";
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            rpifm.fm2html(JSON.parse(req.responseText));
        }
    }
    if (rpifm.cmds.search(/\/[iaAIHJ]\//) != -1) {
        req.open("POST", "fm/");
        req.setRequestHeader("Content-type","application/json");
        req.send(JSON.stringify(rpifm.cmds.split('/')));
    } else {
        req.open("GET", "fm/" + rpifm.cmds, true);
        req.send();
    }
}

rpifm.fm2html = function(fm) {
    document.getElementById("statusbar").innerHTML = "";
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
        if (fm[i].ops.length <= 1) {
            continue;
        }
        html += '<p class="' + c + '"' + style + '>';
        html += util.ops_buttons('rpifm.lastcmd', fm[i]);
        html += '</p>';
    }
    document.getElementById("fm").innerHTML = html;
}

// Send one rpi.fm command
rpifm.cmd = function(command) {
    rpifm.cmds = (command + "/");
    rpifm.sendcmds();
}

// Append rpi.fm command to list, send all
rpifm.addcmd = function() {
    for (var i = 0; i < arguments.length; i++) {
        var cmd = arguments[i];
        if (cmd.search(/^\//) != -1) {
            cmd = cmd.replace(/^\//, '');
            rpifm.cmds = '';
        }
        rpifm.cmds += (cmd + "/");
    }
    rpifm.sendcmds();
}

// Append rpi.fm command to list, send all, then clear list
rpifm.lastcmd = function(op, file) {
    rpifm.cmds += file + '/' + op + '/';
    rpifm.sendcmds();
    rpifm.cmds = "";
}
