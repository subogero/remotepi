/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
con = {};
con.refresh = false;

con.send = function(cmd) {
    var req = new XMLHttpRequest();
    req.open("GET", "api.pl?" + cmd, true);
    req.send();
}

con.getStatus = function() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            con.status2html(JSON.parse(req.responseText));
        }
    }
    req.open("GET", "S" + Date.now().toString(), true);
    req.send();
    if (this.refresh) {
        setTimeout("con.getStatus()", 2000);
    }
}

con.status2html = function(st) {
    var html = '<p class="even">';
    if (st.image) {
        html += '<img style="float:right" height="80" src="' + st.image + '">';
    }
    html += st.doing + ' ' + con.s2t(st.at) + ' / ' + con.s2t(st.of) + '<br>';
    if (st.what.charAt(0) == '/') {
        html += st.what.substring(1).split('/').join('<br>');
    } else {
        html += st.what;
    }
    html += '</p>';
    var bar = (st.of == 0    ? 0
             : st.at > st.of ? 100
             :                 100 * st.at/st.of).toString() + '%';
    html += '<div id="nowplaying"><div style="width:' + bar + '"></div></div>';
    for (i = 0; i < st.list.length; i++) {
        var c = st.list[i] == st.what ? 'now' : i % 2 ? 'odd' : 'even';
        html += '<p class="' + c + '">' + st.list[i] + '</p>';
    }
    document.getElementById("st").innerHTML = html;
}

con.s2t = function(s) {
    var t = new Date(s * 1000);
    return t.toUTCString().split(' ')[4];
}

con.browse = function(what) {
    var list = document.getElementById("list");
    var home = document.getElementById("home");
    var fm   = document.getElementById("fm");
    var blist = document.getElementById("blist");
    var bhome = document.getElementById("bhome");
    var bfm   = document.getElementById("bfm");
    if (what == "list") {
        list.style.display = 'block'; blist.className = 'tabhi';
        home.style.display = 'none' ; bhome.className = 'tablo';
        fm.style.display   = 'none' ; bfm.className   = 'tablo';
        yt.style.display   = 'none' ; byt.className   = 'tablo';
        help.style.display = 'none' ; bhelp.className = 'tablo';
        this.refresh = true;
        this.getStatus();
    } else if (what == "home") {
        rpi.ls();
        list.style.display = 'none' ; blist.className = 'tablo';
        home.style.display = 'block'; bhome.className = 'tabhi';
        fm.style.display   = 'none' ; bfm.className   = 'tablo';
        yt.style.display   = 'none' ; byt.className   = 'tablo';
        help.style.display = 'none' ; bhelp.className = 'tablo';
        this.refresh = false;
    } else if (what == "fm") {
        rpifm.sendcmds();
        list.style.display = 'none' ; blist.className = 'tablo';
        home.style.display = 'none' ; bhome.className = 'tablo';
        fm.style.display   = 'block'; bfm.className   = 'tabhi';
        yt.style.display   = 'none' ; byt.className   = 'tablo';
        help.style.display = 'none' ; bhelp.className = 'tablo';
        this.refresh = false;
    } else if (what == "yt") {
        rpifm.sendcmds();
        list.style.display = 'none' ; blist.className = 'tablo';
        home.style.display = 'none' ; bhome.className = 'tablo';
        fm.style.display   = 'none' ; bfm.className   = 'tablo';
        yt.style.display   = 'block'; byt.className   = 'tabhi';
        help.style.display = 'none' ; bhelp.className = 'tablo';
        this.refresh = false;
    } else if (what == "help") {
        list.style.display = 'none' ; blist.className = 'tablo';
        home.style.display = 'none' ; bhome.className = 'tablo';
        fm.style.display   = 'none' ; bfm.className   = 'tablo';
        yt.style.display   = 'none' ; byt.className   = 'tablo';
        help.style.display = 'block'; bhelp.className = 'tabhi';
        this.refresh = false;
    }
}
