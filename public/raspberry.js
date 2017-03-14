rpi = {};
rpi.pwd = "/";
rpi.from = '';

rpi.ls = function() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            rpi.ls2html(JSON.parse(req.responseText));
        }
    }
    req.open("GET", "home" + rpi.pwd, true);
    req.send();
}

rpi.scroll_to = function(id) {
    var elem = document.getElementById(id);
    if (elem == null) {
        window.scrollTo(0, 0);
        return;
    }
    var y = 0;
    do {
        y += elem.offsetTop;
    } while (elem = elem.offsetParent);
    window.scrollTo(0, y - 69); // consider tabbar and navbar above
}

rpi.ls2html = function(ls) {
    var home = document.getElementById("home");
    while (home.firstChild) { home.removeChild(home.firstChild) }
    home.appendChild(rpi.navbar());

    var homels = document.createElement('div');
    homels.className = 'homels';
    for (i = 0; i < ls.length; i++) {
        var c = i % 2 ? 'even' : 'odd';
        var name = ls[i].name;

        var p = document.createElement('p');
        p.className = c;
        if (name == rpi.from) { p.id = 'scrollhere' }

        var style = '';
        if (ls[i].ops.indexOf('cd') != -1) {
            var a = document.createElement('a');
            a.href = 'javascript:void(0)';
            a.onclick = function(n) { return function() { rpi.cd(n) } }(name);
            a.appendChild(document.createTextNode(name));
            p.appendChild(a);
            style = 'text-align:right';
        } else {
            p.appendChild(document.createTextNode(name));
        }
        homels.appendChild(p);

        if (ls[i].ops.length <= 1) { continue; }

        var p2 = document.createElement('p');
        p2.className = c;
        if (style) { p2.style = style }
        util.ops_buttons_dom(rpi.op, ls[i]).forEach(function(i) {
            p2.appendChild(i);
        });
        homels.appendChild(p2);
    }
    home.appendChild(homels);
    rpi.scroll_to('scrollhere');
}

rpi.navbar = function() {
    var navbar = document.createElement('div');
    navbar.className = 'homenavbar';
    var dirs = rpi.pwd.split('/');
    dirs.pop();
    var dir = '';
    for (i = 0; i < dirs.length; i++) {
        var label = dirs[i] + '/';
        dir += label;
        var a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.onclick = function(dir) { return function() { rpi.cd(dir) } }(dir);
        a.appendChild(document.createTextNode(label));
        navbar.appendChild(a);
    }
    return navbar;
}

rpi.cd = function(dir) {
    if (dir.substr(0, 1) === '/') {
        rpi.from = '';
        rpi.pwd = dir;
    } else if (dir === "..") {
        var regex = /([^\/]+)\/$/; // pwd shall always end in /
        rpi.from = regex.exec(rpi.pwd)[1]; // [1] for 1st capture group
        rpi.pwd = rpi.pwd.replace(regex, "");
    } else {
        rpi.from = '';
        rpi.pwd += dir + "/";
    }
    rpi.ls();
}

rpi.op = function(cmd, file) {
    var req = new XMLHttpRequest();
    var uri = "home";
    req.open("POST", uri, true);
    req.setRequestHeader("Content-type","application/json");
    req.send(JSON.stringify({ cmd: cmd, file: rpi.pwd + file }));
}
