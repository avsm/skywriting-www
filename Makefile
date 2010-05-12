FILES=index tutorial
.PHONY: all
all: $(FILES:%=%-b.html)
	/anfs/www/tools/bin/ucampas $(FILES)

%-b.html: %.md
	set -e; TITLE="$(head -1 $@)"; \
	echo '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">' > $@; \
	echo "<title>$$TITLE</title>" >> $@; \
	markdown -v -x codehilite $< >> $@
