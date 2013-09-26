/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
function controls(cmd) {
  var req = new XMLHttpRequest();
  req.open("GET", "?" + cmd, true);
  req.send();
}

function browse(what) {
  var home = document.getElementById("home");
  var fm   = document.getElementById("fm");
  if (what == "home") {
    rpi.ls();
    home.style.display = 'block';
    fm.style.display = 'none';
  }
  else if (what == "fm") {
    home.style.display = 'none';
    fm.style.display = 'block';
  }
}
