install: uninstall omxd rpi.fm youtube-dl
	apt-get install apache2 libapache2-mod-fcgid liburi-perl libcgi-fast-perl libjson-xs-perl
	chmod 757 .
	cp apache.cfg /etc/apache2/conf.d/remotepi
	-ln -s `pwd` /var/www
	a2enmod rewrite
	service apache2 restart
uninstall:
	-rm /etc/apache2/conf.d/remotepi
	-rm /var/www/restpi && service apache2 restart
omxd:
	which omxd || ( \
	  git clone https://github.com/subogero/omxd.git; \
	  cd omxd; \
	  make; \
	  make install; \
	  cd ..; \
	  rm -rf omxd; \
	)
rpi.fm:
	which rpi.fm || ( \
	  git clone https://github.com/subogero/rpi.fm.git; \
	  cd rpi.fm; \
	  make install; \
	  cd ..; \
	  rm -rf rpi.fm; \
	)
youtube-dl:
	curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
restart:
	killall api.pl
ps:
	pstree -pu | grep api.pl
