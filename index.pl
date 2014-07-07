#!/usr/bin/perl
# (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3
use URI::Escape;
use CGI::Carp qw(fatalsToBrowser);
use IPC::Open2;
sub ls; sub fm; sub byalphanum; sub yt; sub logger;

# Get root directory
if (open CFG, "/etc/omxd.conf") {
    $root = <CFG>;
    chomp $root;
    $root =~ s|user=|/home/|;
    $root = "/home" unless -d $root;
    close CFG;
} else {
    $root = "/home";
}

# Common head part for normal page and AJAX responses
print <<HEAD;
Content-type: text/html

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
HEAD

# Handle AJAX requests
$get_req = uri_unescape $ENV{QUERY_STRING};
if ($get_req =~ /^S/) {
    print "</head><body>\n";
    print "<div id=\"nowplaying\">\n<p class=\"now\">";
    (my $status = `omxd S`) =~ s/$root//;
    $status =~ m: (\d+)/(\d+):;
    my $progress = ($2 == 0 ? 0 : $1 > $2 ? 100 : 100 * $1 / $2) . '%';
    print $status;
    print "</p>\n<div style=\"width:$progress\"></div>\n</div>";
    if (open PLAY, "/var/local/omxplay") {
        my $class = 'even';
        while (<PLAY>) {
            s/$root//;
            if (s/^>\t//) {
                print "<p class=\"now\">$_</p>\n";
            } else {
                print "<p class=\"$class\">$_</p>\n";
            }
            $class = $class eq 'even' ? 'odd' : 'even';
        }
        close PLAY;
    }
    print "</body></html>";
    exit 0;
} elsif ($get_req =~ /^[NRr.pfFnxXhjdD]$/) {
    print "</head><body></body></html>";
    `omxd $get_req` if $get_req;
    exit 0;
} elsif ($get_req =~ /^([iaAIHJ]) (.+)/) {
    my $cmd = $1;
    my $file = $2;
    $file = "$root$file";
    `omxd $cmd "$file"`;
    print "</head><body></body></html>";
    exit 0;
} elsif ($get_req =~ /^home/) {
    (my $dir = $get_req) =~ s/^home //;
    print "</head>";
    ls $dir;
    print "</html>";
    exit 0;
} elsif ($get_req =~ /^fm/) {
    (my $cmd = $get_req) =~ s/^fm *//;
    print "</head>";
    fm $cmd;
    print "</html>";
    exit 0;
} elsif ($get_req =~ /^yt/) {
    (my $cmd = $get_req) =~ s/^yt *//;
    print "</head>";
    yt $cmd;
    print "</html>";
    exit 0;
} elsif ($get_req) {
    print "<!-- $get_req -->\n";
    exit 0;
}

# Or continue the normal page
print <<HEAD2;
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="raspberry.js"></script>
<script src="fm.js"></script>
<script src="u2b.js"></script>
<script src="controls.js"></script>
<link rel="stylesheet" type="text/css" href="style.css">
<link rel="icon" href="rpi.jpg">
</head>
HEAD2
if (open BODY, "body.html") {
    print while <BODY>;
    close BODY;
}
print "</html>\n";

# Browse Raspberry Pi
sub ls {
    my $dir = shift;
    # Return to root dir upon dangerous attempts
    $dir = $dir =~ /^\./ ? $root : "$root$dir";
    # Sanitize dir: remove double slashes, cd .. until really dir
    $dir =~ s|(.+)/.+|$1| while ! -d $dir;
    print "<body>\n";
    opendir DIR, $dir;
    push @files, $_ while readdir DIR;
    closedir DIR;
    my $class = 'even';
    foreach (sort { -d "$dir/$a" && -f "$dir/$b" ? -1
                  : -f "$dir/$a" && -d "$dir/$b" ?  1
                  :          $a     cmp      $b     } @files) {
        next if /^\.$/;
        next if /^\.\w/;
        next if /^\.\.$/ && $dir eq "$root/";
        if ($_ eq '..') {
            print <<UPDIR;
<p class="$class">
<a href="javascript:void(0)" onclick="rpi.cd(&quot;$_&quot;);">$_/</a><br>
</p>
UPDIR
        } elsif (-d "$dir/$_") {
            print <<DIR;
<p class="$class">
<a href="javascript:void(0)" onclick="rpi.cd(&quot;$_&quot;);">$_/</a><br>
</p>
<p class="$class" style="text-align:right">
<button onclick="rpi.op(&quot;i&quot;,&quot;$_&quot;)" title="insert">i</button>
<button onclick="rpi.op(&quot;a&quot;,&quot;$_&quot;)" title="add">a</button>
<button onclick="rpi.op(&quot;A&quot;,&quot;$_&quot;)" title="append">A</button>
</p>
DIR
        } else {
            print <<FILE;
<p class="$class">
$_<br>
<button onclick="rpi.op(&quot;i&quot;,&quot;$_&quot;)" title="insert">i</button>
<button onclick="rpi.op(&quot;a&quot;,&quot;$_&quot;)" title="add">a</button>
<button onclick="rpi.op(&quot;A&quot;,&quot;$_&quot;)" title="append">A</button>
<button onclick="rpi.op(&quot;I&quot;,&quot;$_&quot;)" title="now">I</button>
<button onclick="rpi.op(&quot;H&quot;,&quot;$_&quot;)" title="HDMI now">H</button>
<button onclick="rpi.op(&quot;J&quot;,&quot;$_&quot;)" title="Jack now">J</button>
</p>
FILE
        }
        $class = $class eq 'even' ? 'odd' : 'even';
    }
    print "</body>\n";
}

# Browse internet radio stations
sub fm {
    my $cmd = shift;
    print <<EOF;
<body><p class="even">
<button onclick="rpifm.cmd(&quot;g&quot;)" title="Genres">Genres</button>
<button onclick="rpifm.cmd(&quot;m&quot;)" title="My Stations">My Stations</button>
</p><p class="odd">
EOF
    my $class = 'odd';
    unless ($cmd) {
        print "</body>\n";
        return;
    }
    my $pid = open2(\*IN, \*OUT, '/usr/bin/rpi.fm') or die $!;
    print OUT $cmd;
    close OUT;
    my $title;
    my %list;
    while (<IN>) {
        s/\r|\n//g;
        if (/^[a-zA-Z]/) {
            $title = $_;
            %list = ();
        } elsif (/^ *(\d+|[<>]) +(.+)$/) {
            $list{$1} = $2;
        }
    }
    close IN;
    waitpid $pid, 0;
    if ($title) {
        $class = $class eq 'even' ? 'odd' : 'even';
        print <<TITLE;
$title</p><p class="$class">
TITLE
    }
    foreach (sort byalphanum keys %list) {
        $class = $class eq 'even' ? 'odd' : 'even';
        unless  ($title) {
            print <<GENRE;
<a href="javascript:void(0)" onclick="rpifm.addcmd(&quot;$_&quot;)">$list{$_}</a>
</p><p class="$class">
GENRE
        } elsif ($_ =~ /^[<>]$/) {
            my $label = $_ eq '<' ? 'Previous' : 'Next';
            print <<NAVI;
<button onclick="rpifm.addcmd(&quot;$_&quot;)" title="insert">$label</button>
NAVI
        } else {
            print <<STATION;
$list{$_}<br>
<button onclick="rpifm.lastcmd(&quot;$_&quot;,&quot;i&quot;)" title="insert">i</button>
<button onclick="rpifm.lastcmd(&quot;$_&quot;,&quot;a&quot;)" title="add">a</button>
<button onclick="rpifm.lastcmd(&quot;$_&quot;,&quot;A&quot;)" title="append">A</button>
<button onclick="rpifm.lastcmd(&quot;$_&quot;,&quot;I&quot;)" title="now">I</button>
<button onclick="rpifm.lastcmd(&quot;$_&quot;,&quot;H&quot;)" title="HDMI now">H</button>
<button onclick="rpifm.lastcmd(&quot;$_&quot;,&quot;J&quot;)" title="Jack now">J</button>
</p><p class="$class">
STATION
        }
    }
}

sub byalphanum {
    return $a <=> $b if $a =~ /^\d+$/ && $b =~ /^\d+$/;
    return $a cmp $b;
}

# Browse and play YouTube
sub yt {
    (my $cmd = shift) =~ /^(\S+) (.*)/;
    my ($cmd, $query) = ($1, $2);
    logger "yt $cmd $query";
    # Playback command
    if ($cmd ne 'search') {
        my $cred;
        if (open NET, ".netrc") {
            while (<NET>) {
                next unless /^machine youtube.com login (.+) password (.+)\n/;
                $cred = "-u $1 -p $2";
                last;
            }
            close NET;
        }
        my $stream = `youtube-dl $cred -g "$query" 2>>remotepi.log`;
        $stream =~ s/\n//;
        `omxd $cmd "$stream"`;
        return;
    }
    # Search command
    my @hits;
    my $i;
    $query =~ s/ /%20/g;
    $query = "https://gdata.youtube.com/feeds/api/videos?q=$query";
    my $xml = `curl $query 2>/dev/null`;
    while ($xml =~ m|^.*?<entry>(.+?)</media:group>(.*)|s) {
        $xml = $2;
        my $vid = $1;
        next unless $vid =~ m|<link .+?href='([^']+?)&amp;|;
        $hits[$i]{url} = $1;
        $vid =~ m|<media:title type='plain'>(.+?)</media:title>|;
        $hits[$i]{title} = $1;
        $vid =~ m|<media:thumbnail url='([^']+?)' height='90'[^>]+?/>|;
        $hits[$i]{thumbnail} = $1;
        $i++;
    }
    print "<body>\n";
    my $class = 'odd';
    foreach (@hits) {
        print <<VIDEO;
<p class="$class">
$_->{title}
<br>
<button onclick="u2b.op(&quot;i&quot;,&quot;$_->{url}&quot;)" title="insert">i</button>
<button onclick="u2b.op(&quot;a&quot;,&quot;$_->{url}&quot;)" title="add">a</button>
<button onclick="u2b.op(&quot;A&quot;,&quot;$_->{url}&quot;)" title="append">A</button>
<button onclick="u2b.op(&quot;I&quot;,&quot;$_->{url}&quot;)" title="now">I</button>
<button onclick="u2b.op(&quot;H&quot;,&quot;$_->{url}&quot;)" title="HDMI now">H</button>
<button onclick="u2b.op(&quot;J&quot;,&quot;$_->{url}&quot;)" title="Jack now">J</button>
<br>
<img src="$_->{thumbnail}">
</p>
VIDEO
        $class = $class eq 'even' ? 'odd' : 'even';
    }
    print "</body>\n";
}

sub logger {
    open LOG, ">>remotepi.log" or return;
    my $msg = shift;
    print LOG "\n", time(), " PID: $$\n", $msg, "\n";
    close LOG;
}
