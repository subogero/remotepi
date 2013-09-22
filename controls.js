/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
function controls(cmd) {
  var req = new XMLHttpRequest();
  req.open("GET", "?" + cmd, true);
  req.send();
}
