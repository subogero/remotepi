u2b = {};

u2b.search = function(query) {
  document.getElementById("ythits").innerHTML = "Waiting for YouTube...";
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      document.getElementById("ythits").innerHTML = req.responseText;
    }
  }
  req.open("GET", "?yt " + query, true);
  req.send();
}
