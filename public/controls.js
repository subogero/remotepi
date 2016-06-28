/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
con = {};
con.refresh = false;

// Websocket object for status updates
con.ws = new WebSocket('ws://' + window.location.host + '/diff');
con.ws.onmessage = function(event) {
    var elem_st = document.getElementById("st");
    // elem_st.innerHTML = event.data;
    var diff = JSON.parse(event.data);
    con.status2html(diff);
};
con.ws.onopen = function(event) {
    con.ws.send(JSON.stringify({ msg: 'Hello' }));
};
con.ws.onclose = function(event) {
    var elem_st = document.getElementById("st");
    elem_st.innerHTML = 'Websocket to remotepi closed';
};

con.send = function(cmd) {
    var body = { cmd: cmd };
    if (arguments.length == 2) {
        body.file = arguments[1];
    }
    var req = new XMLHttpRequest();
    req.open("POST", "S", false);
    req.setRequestHeader("Content-type","application/json");
    req.send(JSON.stringify(body));
    con.status2html(JSON.parse(req.responseText));
}

con.getStatus = function(suffix) {
    if (suffix == null) {
        suffix = '';
    }
    var req = new XMLHttpRequest();
    req.onreadystatechange = suffix ? function() {
        if (req.readyState == 4 && req.status == 200) {
            alert(JSON.parse(req.responseText).what);
        }
    } : function() {
        if (req.readyState == 4 && req.status == 200) {
            con.status2html(JSON.parse(req.responseText));
        }
    }
    var uri = "S" + Date.now().toString() + suffix;
    req.open("GET", uri, true);
    req.send();
    if (con.refresh) {
        setTimeout("con.getStatus()", 2000);
    }
}

con.status2html = function(st) {
    var stnow = document.getElementById('stnow');
    stnow.onclick = function() { con.getStatus('/details'); };
    if (st.doing != null) {
        document.getElementById('doing').innerHTML = st.doing;
    }
    if (st.at != null) {
        var bar = (st.of == 0    ?   0
                 : st.at > st.of ? 100
                 :                 100 * st.at/st.of).toString()
                + '%';
        document.getElementById('nowat').style.width = bar;
        document.getElementById('atof').innerHTML =
            con.s2t(st.at) + ' / ' + con.s2t(st.of) + '<br>';
    }
    if (st.what != null) {
        var html = st.what.charAt(0) == '/'
            ? st.what.substring(1).split('/').join('<br>')
            : st.what;
        document.getElementById('what').innerHTML = html;
    }
    con.setimage(st.image);
    if (st.list != null) {
        var html = '';
        for (i = 0; i < st.list.length; i++) {
            var c = i % 2 ? 'even' : 'odd';
            var id = st.list[i].label == st.what ? ' id="now"' : '';
            html += '<p class="' + c + '"' + id + '>';
            html += util.ops_buttons('con.send', st.list[i]);
            html += st.list[i].label + '</p>';
        }
        document.getElementById('playlist').innerHTML = html;
    }
}

con.setimage = function(src) {
    var stnow = document.getElementById('stnow');
    var first = stnow.children[0];
    if (src == null) {
        if (first.tagName == 'IMG') {
            first.height = stnow.clientHeight;
        }
    } else {
        if (first.tagName == 'IMG') {
            stnow.removeChild(first);
        }
        if (src != '') {
            var img = document.createElement('img');
            img.style.float = "right";
            img.height = stnow.clientHeight;
            img.src = src
            stnow.insertBefore(img, stnow.firstChild);
        }
    }
}

con.s2t = function(s) {
    var t = new Date(s * 1000);
    return t.toUTCString().split(' ')[4];
}

function Tab(name, callback) {
    this.name = name;
    this.content = document.getElementById(name);
    this.button = document.getElementById('b' + name);
    this.callback = callback;
    this.toggle = function(on) {
        this.content.style.display = on ? 'block' : 'none';
        this.button.className = on ? 'tabhi' : 'tablo';
        if (on && typeof this.callback == 'function') {
            this.callback();
        }
    };
}

con.init = function() {
    con.tabs = [
        new Tab('list', con.setimage),
        new Tab('home', rpi.ls),
        new Tab('fm', rpifm.sendcmds),
        new Tab('yt'),
        new Tab('help'),
    ];
    con.itab = 0;
    try {
        con.hammer = new Hammer(document.body);
    }
    catch(err) {
        return;
    }
    con.hammer.get('swipe').set({ velocity: 0.1, threshold: 0.5 });
    con.hammer.on('swipeleft swiperight press', function(ev) {
        switch (ev.type) {
        case 'swiperight':
            if (con.itab > 0) { con.itab--; }
            break;
        case 'swipeleft':
            if (con.itab < con.tabs.length - 1) { con.itab++; }
            break;
        case 'press':
            con.itab = con.tabs.length - 1;
            break;
        }
        con.refresh = con.itab == 0;
        for (var i = 0; i < con.tabs.length; i++) {
            con.tabs[i].toggle(i == con.itab);
        }
        window.scrollTo(0, 0);
    });
}

// This function is called at the end of the page, so create objects here
con.browse = function(what) {
    if (typeof con.tabs === 'undefined') {
        con.init();
    }
    con.refresh = what == 'list';
    for (var i = 0; i < con.tabs.length; i++) {
        var on = con.tabs[i].name == what;
        con.tabs[i].toggle(on);
        if (on) {
            con.itab = i;
        }
    }
    window.scrollTo(0, 0);
}
