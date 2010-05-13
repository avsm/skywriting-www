/* Skylight visualisation for Skywriting event streams.
   (c) 2010, Anil Madhavapeddy <anil@recoil.org>
*/

Skylight = function(json) {
    var meta = json.meta;
    var grid_size = json.meta.grid_size;
    var max_workers = json.meta.max_workers;
    var total_grid_size=800;
    var space_scale = Math.floor(total_grid_size / grid_size);
    console.log(space_scale);
    if (grid_size == 10) radius = 10;
    else if (grid_size == 50) radius = 5;
    else if (grid_size == 20) radius = 7;
    var padding = radius;
    var with_lines = (radius > 5);
    var data = json.events;
    
    var paper = Raphael(10, 1, total_grid_size, total_grid_size);
    var active_label = paper.text(50, 5, "");
    var colmap = {
        'CREATED': '#FF0000',
        'RUNNABLE': '#FFA500',
        'ASSIGNED': '#44A500',
    };
    var evts = {};
    var times = [];
    var circles = {};
    var lines_from = {};
    var active = 0;
    var i = 0;
    task_id_to_coords = function(id) {
        var tx = id % grid_size;
        var ty = Math.floor(id / grid_size);
        var x = (tx + 1) * (radius * 2 + padding);
        var y = (ty + 1) * (radius * 2 + padding);
        var idx = tx + ty * grid_size;
        return {
            idx: idx,
            x: x,
            y: y
        };
    };
    var recstack = 0;
    processEvent = function() {
        var item = data[i];
        var id = item.id
        var coords = task_id_to_coords(item.id);
        var act = item.action;
        if (!circles[coords.idx]) {
            if (act != 'CREATED') console.log('Unexpected act ' + act + ': ' + coords.idx);
            circles[coords.idx] = paper.circle(coords.x, coords.y, radius);
            circles[coords.idx].attr({
                'fill': 'red',
                'stroke-width': 1
            });
            if (with_lines) {
                for (var x in item.deps) {
                    var tcoords = task_id_to_coords(item.deps[x]);
                    var l = paper.path("M" + coords.x + " " + coords.y + "L" + tcoords.x + " " + tcoords.y);
                    if (with_lines) {
                        if (!lines_from[id]) lines_from[id] = [];
                        lines_from[id].push({
                            to: item.deps[x],
                            line: l
                        });
                        l.attr('opacity', '0.1');
                        l.toBack();
                    }
                }
            }
        }
        switch (item.action) {
        case 'CREATED':
            circles[coords.idx].animate({
                'fill':
                colmap[item.action]
            }, 200);
            break;
        case 'RUNNABLE':
            circles[coords.idx].animate({
                'fill': colmap[item.action]
            }, 200);
            for (x in lines_from[id]) {
                var line = lines_from[id][x].line;
                line.animate({
                    opacity: 0.4,
                    stroke: '#009922',
                    'stroke-width': 3
                },
                200);
            }
            break;
        case 'ASSIGNED':
            active = active + 1;
            circles[coords.idx].animate({
                'fill': colmap[item.action]
            },
            200);
            for (x in lines_from[id]) {
                var line = lines_from[id][x].line;
                line.animate({
                    opacity: 0.9,
                    stroke: '#335522',
                    'stroke-width': 4
                },
                200);
            }
            break;
        case 'COMMITTED':
            var scale = Math.floor(active / max_workers * 255);
            var col = "rgb(" + scale + ","+scale + ","+scale+")";
            active = active - 1;
            circles[coords.idx].animate({
                'fill': col
            },
            200);
            for (x in lines_from[id]) {
                var line = lines_from[id][x].line;
                line.animate({
                    opacity: 0.2,
                    stroke: '#000000',
                    'stroke-width': 1
                },
                200);
            }

            break;
        };
        active_label.attr('text', 'Workers: ' + active + " / " + max_workers);
        if (i < data.length - 1) {
            i = i + 1;
            timediff = data[i].time - data[i - 1].time;
            if (timediff < 0.01 && recstack < 100) {
                recstack = recstack + 1;
                processEvent();
            } else {
                recstack = 0;
                setTimeout(processEvent, timediff * 0); /* disabled dynamic scaling for now */
            }
        }

    };
    setTimeout(processEvent, 0);
};
