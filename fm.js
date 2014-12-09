rpifm = {};
rpifm.cmds = "";

rpifm.sendcmds = function() {
    document.getElementById("fm").innerHTML = "Waiting for rpi.fm...";
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            document.getElementById("fm").innerHTML = req.responseText;
        }
    }
    req.open("GET", "fm/" + this.cmds, true);
    req.send();
}

// Send one rpi.fm command
rpifm.cmd = function(command) {
    this.cmds = (command + "/");
    this.sendcmds();
}

// Append rpi.fm command to list, send all
rpifm.addcmd = function() {
    for (var i = 0; i < arguments.length; i++) {
        this.cmds += (arguments[i] + "/");
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
