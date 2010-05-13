#!/usr/bin/python

import json
import sys

# usag: $0 workers grid_size
workers = int(sys.argv[1])
grid_size = int(sys.argv[2])

# load  the json file in
j=[]
fname = "smithwaterman-%d-%d.log" % (workers, grid_size)
with open(fname) as fin:
   j.extend(json.load(fin))

evts=[]
expected_outputs = {} # output_url_id => task_id
outs={} # task_id => [ input dependencies ]
res={}
# discard first events and fix up task ids
discard=3
first_task=None

for evt in j: 
   if first_task is None: first_task = evt['task_id']
   # map expected outputs to task ids
   eouts = evt['expected_outputs']
   for o in eouts:
       print >>sys.stderr, ".",
       sys.stderr.flush()
       task_id = evt['task_id'] - discard - first_task
       if task_id >= 0: expected_outputs[o] = task_id

for evt in j:
   task_id = evt['task_id'] - discard - first_task
   if task_id < 0: continue
   inputs = evt['dependencies']
   deps = []
   # map input SWI URLs to task_ids based on their expected outputs
   for k in inputs:
       if "__ref__" in inputs[k]:
           r = inputs[k]["__ref__"]
           if len(r) == 2 and r[0] == "gfut":
              gid = r[1]
              tid = expected_outputs.get(gid)
              if tid:
                  deps.append(tid)
              else:
                  print >> sys.stderr, "Warning: unknown input depend %d" % gid
   for h in evt['history']:
       tm = h[0]
       ac = h[1]
       if tm not in res: res[tm] = []
       v = { 'time': tm, 'action': ac, 'id': task_id }
       if ac == 'CREATED': v['deps'] = deps
       res[tm].append(v)

# sort by timestamp
stamps = res.keys()
stamps.sort()
out=[]
metadata={ 'grid_size': grid_size, 'max_workers': workers }
for t in stamps:
    out.extend(res[t])
x = { 'meta' : metadata, 'events': out }
print json.dumps(x)
