fm = {};
fm.cmds = "";

fm.sendcmds = function() {
    util.byId("statusbar").innerHTML = "Waiting for rpi.fm...";
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            fm.fm2html(JSON.parse(req.responseText));
        }
    }
    if (fm.cmds.search(/\/[iaAIHJ]\//) != -1) {
        req.open("POST", "fm/");
        req.setRequestHeader("Content-type","application/json");
        req.send(JSON.stringify(fm.cmds.split('/')));
    } else {
        req.open("GET", "fm/" + fm.cmds, true);
        req.send();
    }
}

fm.fm2html = function(fmdata) {
    util.byId("statusbar").innerHTML = "";
    var fmlist = util.byIdEmpty('fm');
    for (i = 0; i < fmdata.length; i++) {
        var c = i % 2 ? 'odd' : 'even';
        var label = fmdata[i].label ? fmdata[i].label : fmdata[i].name;
        var p1 = util.newEl('p');
        p1.className = c;
        if (fmdata[i].ops.indexOf('cd') != -1) {
            var a = util.newEl('a');
            a.href = 'javascript:void(0)';
            a.onclick = function(name) {
                return function() { fm.addcmd(name) };
            }(fmdata[i].name);
            util.appendTxt(a, label);
            p1.appendChild(a);
        } else {
            util.appendTxt(p1, label);
        }
        fmlist.appendChild(p1);

        var p2 = util.newEl('p');
        p2.className = c;
        if (fmdata[i].ops.indexOf('cd') != -1) { p2.style = 'text-align:right' }
        util.appendOpsButtons(p2, fm.lastcmd, fmdata[i]);
        fmlist.appendChild(p2);
    }
}

// Send one rpi.fm command
fm.cmd = function(command) {
    fm.cmds = (command + "/");
    fm.sendcmds();
}

// Append rpi.fm command to list, send all
fm.addcmd = function() {
    for (var i = 0; i < arguments.length; i++) {
        var cmd = arguments[i].toString();
        if (cmd.search(/^\//) != -1) {
            cmd = cmd.replace(/^\//, '');
            fm.cmds = '';
        }
        fm.cmds += (cmd + "/");
    }
    fm.sendcmds();
}

// Append rpi.fm command to list, send all, then clear list
fm.lastcmd = function(op, file) {
    fm.cmds += file + '/' + op + '/';
    fm.sendcmds();
    fm.cmds = "";
}
