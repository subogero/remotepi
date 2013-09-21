function controls(cmd) {
  var req = new XMLHttpRequest();
  req.open("GET", "?" + cmd, true);
  req.send();
}
