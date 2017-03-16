/* (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3 */
play = {};

// Websocket for status updates
play.connect = function() {
    if (play.ws != null && play.ws.readyState != 3) {
        return;
    }
    play.ws = new WebSocket('ws://' + window.location.host + '/diff');
    play.ws.onmessage = function(event) {
        var elem_st = util.byId("st");
        var diff = JSON.parse(event.data);
        play.status2html(diff);
        var elem_st = util.byId("statusbar");
        if (elem_st.innerHTML = 'Websocket to remotepi closed') {
            elem_st.innerHTML = '';
        }
    };
    play.ws.onopen = function(event) {
        play.ws.send(JSON.stringify({ msg: 'Hello' }));
    };
    play.ws.onclose = function(event) {
        var elem_st = util.byId("statusbar");
        elem_st.innerHTML = 'Websocket to remotepi closed';
    };
}

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        play.ws.close();
    } else {
        play.connect();
    }
});

play.send = function(cmd) {
    var body = { cmd: cmd };
    if (arguments.length == 2) {
        body.file = arguments[1];
    }
    var req = new XMLHttpRequest();
    req.open("POST", "S", true);
    req.setRequestHeader("Content-type","application/json");
    req.send(JSON.stringify(body));
}

play.getStatus = function(suffix) {
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
            play.status2html(JSON.parse(req.responseText));
        }
    }
    var uri = "S" + Date.now().toString() + suffix;
    req.open("GET", uri, true);
    req.send();
}

play.status2html = function(st) {
    var stnow = util.byId('stnow');
    stnow.onclick = function() { play.getStatus('/details'); };
    if (st.doing != null) {
        util.byId('doing').innerHTML = st.doing;
    }
    if (st.at != null) {
        var bar = (st.of == 0    ?   0
                 : st.at > st.of ? 100
                 :                 100 * st.at/st.of).toString()
                + '%';
        util.byId('nowat').style.width = bar;
        util.byId('atof').innerHTML =
            play.s2t(st.at) + ' / ' + play.s2t(st.of) + '<br>';
    }
    if (st.what != null) {
        var pre = util.newEl('pre');
        pre.innerHTML = st.what.charAt(0) == '/'
            ? st.what.substring(1).split('/').join('\n')
            : st.what.split('://').join('\n');
        var what = util.byId('what');
        if (what.firstChild) { what.removeChild(what.firstChild) }
        what.appendChild(pre);
    }
    play.setimage(st.image);
    play.setlist(st.list, st.what);
}

play.setlist = function(list, what) {
    if (list == null && what == null) {
        return;
    } else if (list != null) {
        if (what == null) {
            var what_old = util.byId('what').innerHTML;
            what = '/' + what_old.split('<br>').join('/');
        }
        var pl = util.byIdEmpty('playlist');
        for (i = 0; i < list.length; i++) {
            var p = util.newEl('p');
            p.className = i % 2 ? 'even' : 'odd';
            if (list[i].label == what) { p.id = 'now' }
            util.appendOpsButtons(p, play.send, list[i]);
            util.appendTxt(p, list[i].label);
            pl.appendChild(p);
        }
    } else { // list == null && what != null
        list = util.byId('playlist').children;
        for (i = 0; i < list.length; i++) {
            var label = list[i].lastChild.textContent;
            var c = i % 2 ? 'even' : 'odd';
            list[i].className = c;
            if (label == what) {
                list[i].id = 'now';
            } else {
                list[i].removeAttribute('id');
            }
        }
    }
}

play.setimage = function(src) {
    var stnow = util.byId('stnow');
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
            var img = util.newEl('img');
            img.style.float = "right";
            img.height = stnow.clientHeight;
            img.src = src
            stnow.insertBefore(img, stnow.firstChild);
        }
    }
}

play.s2t = function(s) {
    var t = new Date(s * 1000);
    return t.toUTCString().split(' ')[4];
}

function Tab(name, callback) {
    this.name = name;
    this.content = util.byId(name);
    this.button = util.byId('b' + name);
    this.callback = callback;
    this.toggle = function(self) {
        return function(on) {
            self.content.style.display = on ? 'block' : 'none';
            self.button.className = on ? 'tabhi' : 'tablo';
            if (on && typeof self.callback == 'function') {
                self.callback();
            }
        }
    }(this);
}

play.init = function() {
    var tabselect = util.byId('tabselect');
    var tabs = [
        { name: 'play', callback: play.settings, label: "playlist" },
        { name: 'rpi', callback: rpi.ls, label: "Local stuff" },
        { name: 'fm', callback: rpifm.sendcmds, label: "Internet Radio" },
        { name: 'u2b', callback: null, label: "YouTube" },
        { name: 'help', callback: null, label: "Help" },
    ];
    play.tabs = [];
    for (var i = 0; i < tabs.length; i++) {
        var blabel = 'b' + tabs[i].name;
        var b = util.newEl('button');
        b.id = blabel;
        b.title = tabs[i].label;
        b.onclick = function(name) {
            return function() { play.browse(name) };
        }(tabs[i].name);
        util.appendTxt(b, tabs[i].name);
        tabselect.appendChild(b);
        util.appendTxt(tabselect, ' ');
        play.tabs.push(new Tab(tabs[i].name, tabs[i].callback));
    }
    play.itab = 0;
    try {
        play.hammer = new Hammer(document.body);
    }
    catch(err) {
        return;
    }
    play.hammer.get('swipe').set({ velocity: 0.1, threshold: 0.5 });
    play.hammer.on('swipeleft swiperight press', function(ev) {
        switch (ev.type) {
        case 'swiperight':
            if (play.itab > 0) { play.itab--; }
            break;
        case 'swipeleft':
            if (play.itab < play.tabs.length - 1) { play.itab++; }
            break;
        case 'press':
            play.itab = play.tabs.length - 1;
            break;
        }
        for (var i = 0; i < play.tabs.length; i++) {
            play.tabs[i].toggle(i == play.itab);
        }
        window.scrollTo(0, 0);
    });
}

// This function is called at the end of the page, so create objects here
play.browse = function(what) {
    if (typeof play.tabs === 'undefined') {
        play.init();
    }
    for (var i = 0; i < play.tabs.length; i++) {
        var on = play.tabs[i].name == what;
        play.tabs[i].toggle(on);
        if (on) {
            play.itab = i;
        }
    }
    window.scrollTo(0, 0);
    play.connect();
}
