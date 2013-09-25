rpi = {};
rpi.pwd = "/";

rpi.run = function() {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      document.getElementById("home").innerHTML = req.responseText;
    }
  }
  req.open("GET", "?home " + this.pwd, true);
  req.send();
}

rpi.cd = function(dir) {
  if (dir === "..") {
    var regex = /[^\/]+\/$/;
    this.pwd = this.pwd.replace(regex, "");
  } else {
    this.pwd += dir + "/";
  }
  this.run();
}
