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
