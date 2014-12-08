#!/usr/bin/perl
# (C) 2013 SZABO Gergely <szg@subogero.com> GNU AGPL v3
use feature state;
use URI::Escape;
use CGI qw(:standard);
use CGI::Carp qw(fatalsToBrowser);
use CGI::Fast;
use IPC::Open2;
use Fcntl ':mode';
use Cwd;
use JSON::XS;
sub status; sub thumbnail;
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
        (my $dir = $get_req) =~ s/^home//;
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
    my ($dir) = $what =~ m|^(/.+)/[^/]+$|;
    $what =~ s/$root//;
    my $response = { doing => $doing, at => $at+0, of => $of+0, what => $what };
    @{$response->{list}} = map { s/^(> )?$root(.+)\n/$2/; $_ } <PLAY>;
    $response->{image} = thumbnail $dir;
    print encode_json $response;
}

# Get thumbnail image link from current playback directory
sub thumbnail {
    my $dir = shift;
    state ($dir_old, $img_old);
    return $img_old if $dir eq $dir_old;
    unlink $img_old;
    return unless $dir && opendir DIR, $dir;
    my $img;
    while (readdir DIR) {
        next unless /(png|jpe?g)$/i;
        next if $_ eq 'rpi.jpg';
        symlink "$dir/$_", $_ or logger "Unable to symlink $_";
        $dir_old = $dir;
        $img_old = $_;
        $img = $_;
        last;
    }
    close DIR;
    return $img;
}

# Browse Raspberry Pi
sub ls {
    my $dir = shift;
    # Return to root dir upon dangerous attempts
    $dir = $dir =~ /^\.|^$/ ? $root : "$root$dir";
    # Sanitize dir: remove double slashes, cd .. until really dir
    $dir =~ s|(.+)/.+|$1| while ! -d $dir;
    opendir DIR, $dir;
    my @files;
    push @files, $_ while readdir DIR;
    closedir DIR;
    my $response = [];
    foreach (sort { -d "$dir/$a" && -f "$dir/$b" ? -1
                  : -f "$dir/$a" && -d "$dir/$b" ?  1
                  :          $a     cmp      $b     } @files) {
        next if /^\.$/;
        next if /^\.\w/;
        next if /^\.\.$/ && $dir eq "$root/";
        if ($_ eq '..') {
            push @$response, { name => $_, ops => [ qw(cd) ] };
        } elsif (-d "$dir/$_") {
            push @$response, { name => $_, ops => [ qw(cd i a A) ] };
        } else {
            push @$response, { name => $_, ops => [ qw(i a A I H J) ] };
        }
    }
    print encode_json $response;
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
    local $| = 1; # autoflush to logfile
    print LOG "\n", time(), " PID: $$\n", $msg, "\n";
}
