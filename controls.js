/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
function controls(cmd) {
  var req = new XMLHttpRequest();
  req.open("GET", "?" + cmd, true);
  req.send();
}

function browse(what) {
  var list = document.getElementById("list");
  var home = document.getElementById("home");
  var fm   = document.getElementById("fm");
  var blist = document.getElementById("blist");
  var bhome = document.getElementById("bhome");
  var bfm   = document.getElementById("bfm");
  if (what == "list") {
    list.style.display = 'block';
    blist.className = 'tabhi';
    home.style.display = 'none';
    bhome.className = 'tablo';
    fm.style.display = 'none';
    bfm.className = 'tablo';
  }
  else if (what == "home") {
    rpi.ls();
    list.style.display = 'none';
    blist.className = 'tablo';
    home.style.display = 'block';
    bhome.className = 'tabhi';
    fm.style.display = 'none';
    bfm.className = 'tablo';
  }
  else if (what == "fm") {
    list.style.display = 'none';
    blist.className = 'tablo';
    home.style.display = 'none';
    bhome.className = 'tablo';
    fm.style.display = 'block';
    bfm.className = 'tabhi';
  }
}
