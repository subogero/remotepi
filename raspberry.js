rpi = {};
rpi.pwd = "/";

rpi.ls = function() {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            rpi.ls2html(JSON.parse(req.responseText));
        }
    }
    req.open("GET", "home" + this.pwd, true);
    req.send();
}

rpi.ls2html = function(ls) {
    var html = '';
    for (i = 0; i < ls.length; i++) {
        var c = i % 2 ? 'odd' : 'even';
        html += '<p class="' + c + '">';
        var style = '';
        if (ls[i].ops.indexOf('cd') != -1) {
            html += '<a href="javascript:void(0)" ' +
                    'onclick="rpi.cd(&quot;' + ls[i].name + '&quot;);">' +
                    ls[i].name + '/</a></p>';
            style = ' style="text-align:right"';
        } else {
            html += ls[i].name + '</p>';
        }
        var ops = ls[i].ops;
        if (ops.length <= 1) {
            continue;
        }
        html += '<p class="' + c + '"' + style + '>';
        for (op = 0; op < ops.length; op++) {
            if (ops[op] == 'cd') {
                continue;
            }
            html += '<button onclick="rpi.op(&quot;' + ops[op] + '&quot;,' +
                    '&quot;' + ls[i].name + '&quot;)" ' +
                    'title="' + ops[op] + '">' + ops[op] + '</button> ';
        }
        html += '</p>';
    }
    document.getElementById("home").innerHTML = html;
}

rpi.cd = function(dir) {
    if (dir === "..") {
        var regex = /[^\/]+\/$/;
        this.pwd = this.pwd.replace(regex, "");
    } else {
        this.pwd += dir + "/";
    }
    this.ls();
}

rpi.op = function(cmd, file) {
    var req = new XMLHttpRequest();
    var uri = "api.pl?" + cmd + " " + this.pwd + file;
    req.open("GET", uri, true);
    req.send();
}
