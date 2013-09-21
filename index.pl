#!/usr/bin/perl
print <<HEAD;
Content-type: text/html

<!DOCTYPE html>
<html>
<head>
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
</style></head>
<body>
HEAD

my $query = $ENV{QUERY_STRING} || 'S';
`omxd $query` if $query;

print '<div class="st">';
print '<a href="?S">';
system "omxd S";
print '</a></div>';
print <<CON;
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
CON

print <<FOOT;
</body>
</html>
FOOT
