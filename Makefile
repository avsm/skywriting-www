FILES=index installation tutorial

.PHONY: all
all:
	/anfs/www/tools/bin/ucampas -r

.PHONY: dev
dev: $(FILES:%=%-b.html)
	@ :

%-b.html: %.md style.css Makefile
	set -e; echo '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">' > $@; \
	echo "<title>`head -1 $<`</title>" >> $@; \
	echo "<body><style>" >> $@; \
	cat style.css >> $@; \
	echo "</style>" >> $@; \
	cat analytics.html >> $@; \
	markdown -v -x codehilite $< >> $@; \
	echo "</body>" >> $@

style.css:
	pygmentize -f html -S friendly -a .codehilite > $@

.PHONY: clean
clean:
	rm -f *.html
