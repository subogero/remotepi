/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
function controls(cmd) {
  var req = new XMLHttpRequest();
  req.open("GET", "?" + cmd, true);
  req.send();
}

function run_home() {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      document.getElementById("home").innerHTML = req.responseText;
    }
  }
  req.open("GET", "?home /", true);
  req.send();
}

function browse(what) {
  var home = document.getElementById("home");
  var fm   = document.getElementById("fm");
  if (what == "home") {
    home.style.display = 'block';
    fm.style.display = 'none';
    run_home();
  }
  else if (what == "fm") {
    home.style.display = 'none';
    fm.style.display = 'block';
  }
}
