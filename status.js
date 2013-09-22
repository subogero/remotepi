/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
function getStatus() {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      document.getElementById("st").innerHTML = req.responseText;
    }
  }
  req.open("GET", "?S", true);
  req.send();
  setTimeout("getStatus()",2000)
}
