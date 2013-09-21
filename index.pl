#!/usr/bin/perl
print <<HEAD;
Content-type: text/html

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
HEAD

my $query = $ENV{QUERY_STRING};
if ($query eq 'S') {
    print "</head><body>";
    system "omxd", $query;
    print "</body></html>";
    exit 0;
} elsif ($query =~ /^[NRr.pfFn]$/) {
    print "</head><body></body></html>";
    `omxd $query` if $query;
    exit 0;
}

print <<HTML;
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family:Monospace; margin:0 }
div.st {
  background-color:#ffc040;
  font-size:80%; font-weight:bold; text-align:center; line-height:200%
}
div.con { text-align:center }
a:link { text-decoration:none }
a:visited { text-decoration:none }
</style>
<script src="status.js"></script>
<script src="controls.js"></script>
</head>
<body>
<div class="st" id="st">Status</div>
<script>getStatus();</script>
<div class="con"><p>
<button onclick="controls('N')">N</button>
<button onclick="controls('R')">R</button>
<button onclick="controls('r')">r</button>
<button onclick="controls('.')">.</button>
<button onclick="controls('p')">p</button>
<button onclick="controls('f')">f</button>
<button onclick="controls('F')">F</button>
<button onclick="controls('n')">n</button>
</p>
<p>
<a href="?/home">[Raspberry]</a>
<a href="?fm">[rpi.fm]</a>
</p></div>
</body>
</html>
HTML
