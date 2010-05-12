FILES=index tutorial
.PHONY: all
all:
	/anfs/www/tools/bin/ucampas $(FILES)

.PHONY: dev
dev: $(FILES:%=%-b.html)
	@ :

%-b.html: %.md style.css
	set -e; echo '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">' > $@; \
	echo "<title>`head -1 $<`</title>" >> $@; \
	echo "<body><style>" >> $@; \
	cat style.css >> $@; \
	echo "</style>" >> $@; \
	markdown -v -x codehilite $< >> $@; \
	echo "</body>" >> $@

style.css:
	pygmentize -f html -S colorful -a .codehilite > $@

.PHONY: clean
clean:
	rm -f *.html
