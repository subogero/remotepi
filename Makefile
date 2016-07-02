define DESCR
Description: Lightweight Raspberry Pi media player
 Remote control web-app, playlist, local files, internet radio and YouTube
endef
export DESCR
SHELL := bash
REL := .release

# Empty first rule just for bloody dh_auto_install's sake
all:
install:
	-mkdir -p $(DESTDIR)/usr/share/remotepi
	cp -r -t $(DESTDIR)/usr/share/remotepi README remotepi public remotepi.service
uninstall:
	rm -rf $(DESTDIR)/usr/share/remotepi
clean:
	rm -rf .release
# Debug
restart:
	-systemctl stop remotepi
	$(MAKE) install
	-systemctl daemon-reload
	-systemctl start remotepi
debug:
	-systemctl stop remotepi
	-./remotepi
udebug:
	-killall remotepi
	-systemctl start remotepi
ps:
	pstree -pu | grep remotepi
# Release
tag:
	@git status | grep -q 'nothing to commit' || (echo Worktree dirty; exit 1)
	@echo 'Chose old tag to follow: '; \
	select OLD in `git tag`; do break; done; \
	export TAG; \
	read -p 'Please Enter new tag name: ' TAG; \
	sed -r -e "s/^remotepi [0-9.]+<br>$$/remotepi $$TAG<br>/" \
	       -e 's/([0-9]{4}-)[0-9]{4}/\1'`date +%Y`/ \
	       -i public/index.html || exit 1; \
	git commit -a -m "version $$TAG"; \
	echo Adding git tag $$TAG; \
	echo "remotepi ($$TAG)" > changelog; \
	if [ -n "$$OLD" ]; then \
	  git log --pretty=format:"  * %h %an %s" $$OLD.. >> changelog; \
	  echo >> changelog; \
	else \
	  echo '  * Initial release' >> changelog; \
	fi; \
	echo " -- `git config user.name` <`git config user.email`>  `date -R`" >> changelog; \
	git tag -a -F changelog $$TAG HEAD; \
	rm changelog
utag:
	TAG=`git log --oneline --decorate | head -n1 | sed -rn 's/^.+ version (.+)/\1/p'`; \
	[ "$$TAG" ] && git tag -d $$TAG && git reset --hard HEAD^
tarball: clean
	export TAG=`sed -rn 's/^remotepi (.+)<br>$$/\1/p' public/index.html`; \
	$(MAKE) balls
balls:
	mkdir -p $(REL)/remotepi-$(TAG); \
	cp -rt $(REL)/remotepi-$(TAG) *; \
	cd $(REL); \
	tar -czf remotepi_$(TAG).tar.gz remotepi-$(TAG)
deb: tarball
	export TAG=`sed -rn 's/^remotepi (.+)<br>$$/\1/p' public/index.html`; \
	export DEB=$(REL)/remotepi-$${TAG}/debian; \
	$(MAKE) debs
debs:
	-rm $(REL)/*.deb
	cp -f $(REL)/remotepi_$(TAG).tar.gz $(REL)/remotepi_$(TAG).orig.tar.gz
	mkdir -p $(DEB)
	echo 'Source: remotepi'                                      >$(DEB)/control
	echo 'Section: web'                                         >>$(DEB)/control
	echo 'Priority: optional'                                   >>$(DEB)/control
	sed -nr 's/^C.+ [-0-9]+ (.+)$$/Maintainer: \1/p' public/index.html >>$(DEB)/control
	echo 'Build-Depends: debhelper, curl'                       >>$(DEB)/control
	echo 'Standards-version: 3.8.4'                             >>$(DEB)/control
	echo                                                        >>$(DEB)/control
	echo 'Package: remotepi'                                    >>$(DEB)/control
	echo 'Architecture: all'                                    >>$(DEB)/control
	echo 'Depends: $${shlibs:Depends}, $${misc:Depends}, libmojolicious-perl, liburi-perl, libjson-xs-perl, omxd, rpi.fm, u2b, curl' >>$(DEB)/control
	echo "$$DESCR"                                              >>$(DEB)/control
	grep Copyright public/index.html               >$(DEB)/copyright
	echo 'License: GNU AGPL v3'                   >>$(DEB)/copyright
	echo ' See /usr/share/common-licenses/AGPL-1' >>$(DEB)/copyright
	echo usr/share/remotepi >$(DEB)/remotepi.dirs
	echo 7 > $(DEB)/compat
	for i in `git tag | sort -rg`; do git show $$i | sed -n '/^remotepi/,/^ --/p'; done \
	| sed -r 's/^remotepi \((.+)\)$$/remotepi (\1-1) UNRELEASED; urgency=low/' \
	| sed -r 's/^(.{,79}).*/\1/' \
	> $(DEB)/changelog
	echo '#!/usr/bin/make -f' > $(DEB)/rules
	echo '%:'                >> $(DEB)/rules
	echo '	dh $$@'          >> $(DEB)/rules
	cp -t $(DEB) prerm
	cp -t $(DEB) postinst
	chmod 755 $(DEB)/rules
	mkdir -p $(DEB)/source
	echo '3.0 (quilt)' > $(DEB)/source/format
	@cd $(REL)/remotepi-$(TAG) && \
	echo && echo List of PGP keys for signing package: && \
	gpg -K | grep uid && \
	read -ep 'Enter key ID (part of name or alias): ' KEYID; \
	if [ "$$KEYID" ]; then \
	  dpkg-buildpackage -k$$KEYID; \
	else \
	  dpkg-buildpackage -us -uc; \
	fi
	fakeroot alien -kr --scripts $(REL)/*.deb; mv *.rpm $(REL)
release: tag deb
