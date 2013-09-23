#!/usr/bin/perl
# C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3
use HTML::Entities;
use CGI::Carp qw(fatalsToBrowser);
sub browse_home;

# Common head part for normal page and AJAX responses
print <<HEAD;
Content-type: text/html

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
HEAD

# Handle AJAX requests
$get_req = $ENV{QUERY_STRING};
if ($get_req eq 'S') {
    print "</head><body>";
    system "omxd", $get_req;
    print "</body></html>";
    exit 0;
} elsif ($get_req =~ /^[NRr.pfFn]$/) {
    print "</head><body></body></html>";
    `omxd $get_req` if $get_req;
    exit 0;
} elsif ($get_req =~ /^home/) {
    (my $dir = decode_entities $get_req) =~ s/^home //;
    print "</head>";
    browse_home $dir;
    print "</html>";
    exit 0;
} elsif ($get_req) {
    print "<!-- $get_req -->\n";
    exit 0;
}

# Or continue the normal page
print <<HEAD2;
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="status.js"></script>
<script src="controls.js"></script>
<link rel="stylesheet" type="text/css" href="style.css">
</head>
HEAD2
if (open BODY, "body.html") {
    print while <BODY>;
    close BODY;
}
print "</html>\n";

# Browse Raspberry Pi
sub browse_home {
    my $dir = shift;
    my $root;
    if (open CFG, "/etc/remotepi.cfg") {
        $root = <CFG>;
        chomp $root;
        close CFG;
    } else {
        $root = "/home";
    }
    $dir = $dir =~ /^\./ ? $root : "$root/$dir";
    $dir =~ s|(.+)/.+|$1| while ! -d $dir;
    print "<body>\n";
    opendir DIR, $dir;
    push @files, $_ while readdir DIR;
    closedir DIR;
    foreach (sort @files) {
        next if /^\.$/;
        next if /^\.\w/;
        next if /^\.\.$/ && $dir eq $root;
        print "<p>$_</p>\n";
    }
    print "</body>\n";
}
