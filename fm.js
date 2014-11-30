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
  req.open("GET", "api.pl?fm " + this.cmds, true);
  req.send();
}

rpifm.cmd = function(command) {
  this.cmds = (command + "%0a");
  this.sendcmds();
}

rpifm.addcmd = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.cmds += (arguments[i] + "%0a");
  }
  this.sendcmds();
}

rpifm.lastcmd = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.cmds += (arguments[i] + "%0a");
  }
  this.sendcmds();
  this.cmds = "";
}
