FILES=index tutorial
.PHONY: all
all:
	/anfs/www/tools/bin/ucampas $(FILES)

.PHONY: dev
dev: $(FILES:%=%-b.html)
	@ :

%-b.html: %.md
	set -e; TITLE="$(head -1 $@)"; \
	echo '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">' > $@; \
	echo "<title>$$TITLE</title>" >> $@; \
	echo "<body" >> $@; \
	markdown -v -x codehilite $< >> $@; \
	echo "</body>" >> $@

.PHONY: clean
clean:
	rm -f *.html
