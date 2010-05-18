Skywriting Tutorial
===================

*This is a work-in-progress page and probably not ready for general consumption yet*

Skywriting is a task-parallel language and execution engine for programming clusters of computing resources.
It has a familiar Javascript-like syntax, but with a few changes to adapt it to a parallel environment.

In this intermediate tutorial, we describe how to implement the [Smith-Waterman](http://en.wikipedia.org/wiki/Smith–Waterman_algorithm) string matching algorithm.

How it works
------------

Smith-Waterman uses dynamic programming to obtain the optimal alignment between two strings (useful for example in gene splicing in bioinformatics).
However for inputs of length *m* and *n*, it requires *O(mn)* time, which limits its usefulness for long DNA sequences.

The algorithm computes a cost matrix *H* of which each element *H<sub>i,j</sub>* depends on *H<sub>i-1,j-1</sub>*, *H<sub>i-1,j</sub>* and *H<sub>i,j-1</sub>*.
At the start of the algorithm, no parallelism is possible, but as the algorithm progresses, a growing "wavefront" of independent values becomes calculable.
The cost matrix can be divided into sub-matrices, which exhibit the same data dependency pattern.

You can see this visualised as a live animation with a varying task size and number of parallel workers running *(uses HTML5, so a modern Safari, Firefox or Chrome needed)*:

<table cellspacing="5">
  <tr><th>Grid Size</th><th colspan="3">Number of Workers</th></tr>
  <tr><td>10</td><td><a href="data/skylight.html?grid=10&workers=10" target="_blank">10</a></td><td><a href="data/skylight.html?grid=10&workers=20" target="_blank">20</a></td><td><a href="data/skylight.html?grid=10&workers=50" target="_blank">50</a></td></tr>
  <tr><td>12</td><td><a href="data/skylight.html?grid=12&workers=10" target="_blank">10</a></td><td><a href="data/skylight.html?grid=12&workers=20" target="_blank">20</a></td><td><a href="data/skylight.html?grid=12&workers=50" target="_blank">50</a></td></tr>
  <tr><td>15</td><td><a href="data/skylight.html?grid=15&workers=10" target="_blank">10</a></td><td><a href="data/skylight.html?grid=15&workers=20" target="_blank">20</a></td><td><a href="data/skylight.html?grid=15&workers=50" target="_blank">50</a></td></tr>
  <tr><td>17</td><td><a href="data/skylight.html?grid=17&workers=10" target="_blank">10</a></td><td><a href="data/skylight.html?grid=17&workers=20" target="_blank">20</a></td><td><a href="data/skylight.html?grid=17&workers=50" target="_blank">50</a></td></tr>
  <tr><td>20</td><td><a href="data/skylight.html?grid=20&workers=10" target="_blank">10</a></td><td><a href="data/skylight.html?grid=20&workers=20" target="_blank">20</a></td><td><a href="data/skylight.html?grid=20&workers=50" target="_blank">50</a></td></tr>
</table>

Each node in the graph represents an execution of the serial Smith-Waterman algorithm on portions of the two strings.
A task progresses through being constructed (red node), becoming runnable (green node), to completing (grayscale node).  The colour of the completed nodes represents the *efficiency* of the cluster at the time the task was completed, with white meaning fully utilised and black unused.

Look at the [completed 50x50 graph](data/50x50-50w-result.jpg) which shows how the utilisation is at its best at the diagonal of the grid for Smith Waterman.
This is a nice way of visualising how well your algorithms are using the resources you give it.

Initializing
------------

We start off the algorithm by defining the size of the grid, and the location of the source data.

    :::javascript
    num_rows = 10;
    num_cols = 10;

    horiz_source = ref("http://www.cl.cam.ac.uk/~dgm36/horizontal_string_random");
    vert_source = ref("http://www.cl.cam.ac.uk/~dgm36/vertical_string_random");
    java_lib = [ref("http://www.cl.cam.ac.uk/~dgm36/dp.jar")];

The `ref()` function constructs a reference, which Skywriting uses to name large amounts of data without loading them.
Passing a reference as a parameter to a function copies the reference but does not copy the referenced data.
A Skywriting reference and the data to which it refers are immutable. Once constructed, a reference and its underlying data may be cached across the cluster, to improve efficiency.

    :::javascript
    horiz_chunks = spawn_exec("java", { "inputs" : [horiz_source], "lib" : java_lib, 
        "class" : "tests.dp.PartitionInputString", "argv":[] }, num_cols);
    vert_chunks = spawn_exec("java", {"inputs":[vert_source], "lib":java_lib, 
         "class" : "tests.dp.PartitionInputString", "argv":[] }, num_rows);

In a Skywriting program, data- and CPU-intensive tasks are delegated to external code.
The `exec()` function synchronously executes the code and the *spawn()* constructs a new parallel task.
The convenience function `spawn_exec()` used above performs both, and returns a reference to the newly formed task.

All calls to `exec()` specify the name of an executor plugin to define how to run the code, and the arguments typically include one or more references.
In the above code, the Java plugin executes a method call that partitions the input strings into 10 chunks.
Meanwhile, the script continues executing, and `horiz_chunks` and `vert_chunks` are references to the output for when it completes.

    :::javascript
    blocks = [];
    blocks[0] = [];

    blocks[0][0] = spawn_exec("java",  
           { "argv" : ["tl", -1, -1, -1, 2], "lib" : java_lib, 
             "class" : "tests.dp.SmithWaterman", "inputs" : [horiz_chunks[0], vert_chunks[0] ]
           }, 3);
    for (j in range(1, num_cols)) {
        blocks[0][j] = spawn_exec("java", 
           { "argv":["t", -1, -1, -1, 2], "lib" : java_lib, 
             "class" : "tests.dp.SmithWaterman", 
             "inputs" : [horiz_chunks[j], vert_chunks[0], blocks[0][j-1][2]]
           }, 3);
    }


explain for loop

    :::javascript
    i = 0;
    j = 0;

    for (i in range(1, num_rows)) {
        blocks[i] = [];
        blocks[i][0] = spawn_exec("java", 
            { "argv" : ["l", -1, -1, -1, 2], "lib":java_lib, 
              "class" : "tests.dp.SmithWaterman", 
              "inputs" : [ horiz_chunks[0], vert_chunks[i], blocks[i-1][0][1] ]
            }, 3);
        for (j in range(1, num_cols)) {
            blocks[i][j] = spawn_exec("java", 
                { "argv" : ["i", -1, -1, -1, 2], "lib" : java_lib, 
                  "class" : "tests.dp.SmithWaterman",
                  "inputs" : [ horiz_chunks[j], vert_chunks[i], blocks[i-1][j-1][0], 
                               blocks[i-1][j][1], blocks[i][j-1][2] ]
                }, 3);
        }
    }

more

    :::javascript
    ignore = exec("stdinout", 
        { "inputs" : [blocks[i][j][0]], 
          "command_line" : ["cat"] 
        }, 1);
    return ignore;

Finally, we gather the results and pipe them through the UNIX `stdinout` executor, which passes the references to a shell script.
In this case, the `cat` command concatenates all the outputs into a single file.
