rpi = {};
rpi.pwd = "/";

rpi.ls = function() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            document.getElementById("home").innerHTML = req.responseText;
        }
    }
    req.open("GET", "api.pl?home " + this.pwd, true);
    req.send();
}

rpi.cd = function(dir) {
    if (dir === "..") {
        var regex = /[^\/]+\/$/;
        this.pwd = this.pwd.replace(regex, "");
    } else {
        this.pwd += dir + "/";
    }
    this.ls();
}

rpi.op = function(cmd, file) {
    var req = new XMLHttpRequest();
    var uri = "api.pl?" + cmd + " " + this.pwd + file;
    req.open("GET", uri, true);
    req.send();
}
