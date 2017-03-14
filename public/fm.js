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
    var fmlist = document.getElementById('fm');
    while (fmlist.firstChild) { fmlist.removeChild(fmlist.firstChild) }
    for (i = 0; i < fm.length; i++) {
        var c = i % 2 ? 'odd' : 'even';
        var label = fm[i].label ? fm[i].label : fm[i].name;
        var p1 = document.createElement('p');
        p1.className = c;
        if (fm[i].ops.indexOf('cd') != -1) {
            var a = document.createElement('a');
            a.href = 'javascript:void(0)';
            a.onclick = function(name) {
                return function() { rpifm.addcmd(name) };
            }(fm[i].name);
            a.appendChild(document.createTextNode(label));
            p1.appendChild(a);
        } else {
            p1.appendChild(document.createTextNode(label));
        }
        fmlist.appendChild(p1);

        var p2 = document.createElement('p');
        p2.className = c;
        if (fm[i].ops.indexOf('cd') != -1) { p2.style = 'text-align:right' }
        util.ops_buttons_dom(rpifm.lastcmd, fm[i]).forEach(function(i) {
            p2.appendChild(i);
        });
        fmlist.appendChild(p2);
    }
}

// Send one rpi.fm command
rpifm.cmd = function(command) {
    rpifm.cmds = (command + "/");
    rpifm.sendcmds();
}

// Append rpi.fm command to list, send all
rpifm.addcmd = function() {
    for (var i = 0; i < arguments.length; i++) {
        var cmd = arguments[i].toString();
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
