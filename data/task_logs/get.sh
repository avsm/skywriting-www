#!/bin/sh
# get raw logs and extract one from each to graph

for s in 10 12 15 17 20; do
   for w in 10 20 50; do
      f=sw-logs-${w}-${s}.tar.gz
      ftp http://www.cl.cam.ac.uk/~dgm36/sw_tasks/${f}
      mkdir tmp
      cd tmp
      tar -zxf ../${f}
      rm -f ../${f}
      d=sw-tasks-${w}-2.log
      mv ${d} ../smithwaterman-${w}-${s}.log
      cd ..
      rm -rf tmp
      ./toevent.py ${w} ${s} > ../smithwaterman-events-${w}-${s}.json
   done
done
