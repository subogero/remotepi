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
}
`omxd $query` if $query;

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
</head>
<body>
<div class="st" id="st">Status</div>
<script>getStatus();</script>
<div class="con"><p>
<a href="?N">[N]</a>
<a href="?R">[R]</a>
<a href="?r">[r]</a>
<a href="?.">[.]</a>
<a href="?p">[p]</a>
<a href="?f">[f]</a>
<a href="?F">[F]</a>
<a href="?n">[n]</a>
</p>
<p>
<a href="?/home">[Raspberry]</a>
<a href="?fm">[rpi.fm]</a>
</p></div>
</body>
</html>
HTML
