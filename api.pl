#!/usr/bin/perl
# (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3
use URI::Escape;
use CGI qw(:standard);
use CGI::Carp qw(fatalsToBrowser);
use CGI::Fast;
use IPC::Open2;
use Fcntl ':mode';
use Cwd;
use JSON::XS;
sub status; sub thumbnail; sub where_human;
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
# Open log file
open LOG, ">remotepi.log";

# FastCGI main loop to handle AJAX requests
while (new CGI::Fast) {
    $get_req = uri_unescape $ENV{QUERY_STRING};
    if ($get_req =~ /^S/) {
        status();
    } elsif ($get_req =~ /^[NRr.pPfFnxXhjdD]$/) {
        print header 'text/plain';
        `omxd $get_req`;
    } elsif ($get_req =~ /^([iaAIHJ]) (.+)/) {
        print header 'text/plain';
        my $cmd = $1;
        my $file = $2;
        $file = "$root$file";
        `omxd $cmd "$file"`;
    } elsif ($get_req =~ /^home/) {
        print header 'text/html';
        (my $dir = $get_req) =~ s/^home //;
        ls $dir;
    } elsif ($get_req =~ /^fm/) {
        print header 'text/html';
        (my $cmd = $get_req) =~ s/^fm *//;
        fm $cmd;
    } elsif ($get_req =~ /^yt/) {
        print header 'text/html';
        (my $cmd = $get_req) =~ s/^yt *//;
        yt $cmd;
    } elsif ($get_req) {
        print header 'text/html';
        print "<!-- $get_req -->\n";
    }
}

# Print playlist status
sub status {
    unless (open PLAY, "omxd S all |") {
        print header('text/html', '500 Unable to access omxd status');
        return;
    }
    print header(-type => 'application/json', -charset => 'utf-8');
    my $now = <PLAY>;
    chomp $now;
    my ($doing, $at, $of, $what) = split /[\s\/]/, $now, 4;
    $what =~ s/$root//;
    my $response = { doing => $doing, at => $at, of => $of, what => $what };
    @{$response->{list}} = map { s/^(> )?$root(.+)\n/$2/; $_ } <PLAY>;
    print encode_json $response;
}

sub status_old {
    unless (open PLAY, "omxd S all |") {
        print header('text/html', '500 Unable to access omxd status');
        return;
    }
    print header(-type => 'text/html', -charset => 'utf-8');
    (my $status = <PLAY>) =~ m: (\d+)/(\d+):;
    my $progress = ($2 == 0 ? 0 : $1 > $2 ? 100 : 100 * $1 / $2) . '%';
    my $print_st = $status;
    my ($where, $what, $dir);
    if ($print_st =~ m|^(\w+ \d+/\d+ )(.+)|) {
        ($where, $what) = ($1, $2);
        if ($what =~ m|^(/.+)/[^/]+$|) {
            $dir = $1;
            $what =~ s|^$root||;
            $what =~ s|/|<br>|g;
        } else {
            $what =~ s/^/<br>/;
        }
    }
    $where = where_human $where;
    my $image = thumbnail $dir;
    # Special case: YouTube playback status
    if ($what =~ /rpyt\.fifo/) {
        (my $title = $image) =~ s/^.+src="(.+)\..+$/$1/s;
        $title =~ s/[-_]/ /g;
        $what = "<br>YouTube<br>=======<br>$title";
    }
    print <<ST;
<p class="even">
$image$where$what
</p>
<div id="nowplaying">
<div style="width:$progress"></div>
</div>
ST
    my $class = 'even';
    while (<PLAY>) {
        s/$root//;
        if (s/^>\s//) {
            print "<p class=\"now\">$_</p>\n";
        } else {
            print "<p class=\"$class\">$_</p>\n";
        }
        $class = $class eq 'even' ? 'odd' : 'even';
    }
    close PLAY;
}

# Enhance the playback status to human readable form
sub where_human {
    my $old = shift;
    return "Stopped" unless $old;
    $old =~ m|^(.+) (\d+)/(\d+)|;
    my ($st, $now, $all) = ($1, $2, $3);
    foreach ($now, $all) {
        my $s = $_ % 60;
        my $m = $_ / 60 % 60;
        my $h = int($_ / 3600);
        $_ = '';
        $_ = "$h:" if $h;
        $_ .= $m < 10 ? "0$m:" : "$m:" if $_ || $m;
        $_ .= $s < 10 ? "0$s"  : "$s"  if $_ || $s;
    }
    return "$st $now" . ($all && " / $all");
}

# Get thumbnail image link from current playback directory
sub thumbnail {
    my $dir = shift;
    my $action = shift || 'link';
    my $pwd = getcwd;
    return if $action eq 'purge' && $pwd ne $dir;
    return unless $dir && opendir DIR, $dir;
    while (readdir DIR) {
        next unless /(png|jpe?g)$/i;
        next if $_ eq 'rpi.jpg';
        if ($action eq 'purge') {
            unlink $_;
        } elsif ($action eq 'link') {
            system qq(ln -s "$dir/$_");
            return <<IMG;
<img
style="float:right"
height="80"
src="$_">
IMG
        }
    }
    return;
}

# Browse Raspberry Pi
sub ls {
    my $dir = shift;
    # Return to root dir upon dangerous attempts
    $dir = $dir =~ /^\./ ? $root : "$root$dir";
    # Sanitize dir: remove double slashes, cd .. until really dir
    $dir =~ s|(.+)/.+|$1| while ! -d $dir;
    opendir DIR, $dir;
    my @files;
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
}

# Browse internet radio stations
sub fm {
    my $cmd = shift;
    print <<EOF;
<p class="even">
<button onclick="rpifm.cmd(&quot;g&quot;)" title="Genres">Genres</button>
<button onclick="rpifm.cmd(&quot;m&quot;)" title="My Stations">My Stations</button>
</p><p class="odd">
EOF
    my $class = 'odd';
    unless ($cmd) {
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
        thumbnail getcwd, 'purge';
        system qq(rpyt -$cmd "$query");
        logger qq(rpyt -$cmd "$query");
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
    my $class = 'odd';
    foreach (@hits) {
        print <<VIDEO;
<p class="$class">
$_->{title}
<br>
<button onclick="u2b.op(&quot;I&quot;,&quot;$_->{url}&quot;)" title="now">I</button>
<button onclick="u2b.op(&quot;H&quot;,&quot;$_->{url}&quot;)" title="HDMI now">H</button>
<button onclick="u2b.op(&quot;J&quot;,&quot;$_->{url}&quot;)" title="Jack now">J</button>
<br>
<img src="$_->{thumbnail}">
</p>
VIDEO
        $class = $class eq 'even' ? 'odd' : 'even';
    }
}

sub logger {
    return if tell LOG == -1;
    my $msg = shift;
    print LOG "\n", time(), " PID: $$\n", $msg, "\n";
}
