Skywriting Tutorial
===================

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

You can see this visualised on:

* <a href="data/skylight-10x10-2w.html" target="_blank">10x10 grid with 2 workers</a> (uses HTML5 Canvas)
* <a href="data/skylight-50x50-50w.html" target="_blank">50x50 grid with 50 workers</a> (needs a beefy browser)

Each node in the graph represents an execution of the serial Smith-Waterman algorithm on portions of the two strings.
A task progresses through being constructed (red node), becoming runnable (agreen node), to completing (a gray node).  The colour of the completed nodes represents the *efficiency* of the cluster at the time the task was completed (white is fully utilised and black is unused).

Look at the [completed 50x50x50w graph](data/50x50-50w-result.jpg) which shows how the utilisation is at its best at the diagonal of the grid for Smith Waterman.
This is a nice way of visualising how well your algorithms are using parallel resources (and of course, we are planning future Skywriting support for dynamic constructions of workers and VMs on-demand).

Initializing
------------

For each block we spawn a Skywriting task that executes the serial Smith-Waterman algorithm using the Java executor, and depends on the outputs of its predecessors1.

    :::javascript
    num_rows = 10;
    num_cols = 10;

    horiz_source = ref("http://www.cl.cam.ac.uk/~dgm36/horizontal_string_random");
    vert_source = ref("http://www.cl.cam.ac.uk/~dgm36/vertical_string_random");
    java_lib = [ref("http://www.cl.cam.ac.uk/~dgm36/dp.jar")];

Explain references

    horiz_chunks = spawn_exec("java", {"inputs":[horiz_source], "lib":java_lib, "class":"tests.dp.PartitionInputString", "argv":[]}, num_cols);
    vert_chunks = spawn_exec("java", {"inputs":[vert_source], "lib":java_lib, "class":"tests.dp.PartitionInputString", "argv":[]}, num_rows);

    blocks = [];
    blocks[0] = [];

    blocks[0][0] = spawn_exec("java", {"argv":["tl", 0-1, 0-1, 0-1, 2], "lib":java_lib, "class":"tests.dp.SmithWaterman", "inputs":[horiz_chunks[0], vert_chunks[0]]}, 3);
    for (j in range(1, num_cols)) {
        blocks[0][j] = spawn_exec("java", {"argv":["t", 0-1, 0-1, 0-1, 2], "lib":java_lib, "class":"tests.dp.SmithWaterman", "inputs":[horiz_chunks[j], vert_chunks[0], blocks[0][j-1][2]]}, 3);
    }

    i = 0;
    j = 0;

    for (i in range(1, num_rows)) {
        blocks[i] = [];
        blocks[i][0] = spawn_exec("java", {"argv":["l", 0-1, 0-1, 0-1, 2], "lib":java_lib, "class":"tests.dp.SmithWaterman", "inputs":[horiz_chunks[0], vert_chunks[i], blocks[i-1][0][1]]}, 3);
        for (j in range(1, num_cols)) {
            blocks[i][j] = spawn_exec("java", {"argv":["i", 0-1, 0-1, 0-1, 2], "lib":java_lib, "class":"tests.dp.SmithWaterman", "inputs":[horiz_chunks[j], vert_chunks[i], blocks[i-1][j-1][0], blocks[i-1][j][1], blocks[i][j-1][2]]}, 3);
        }
    }

    ignore = exec("stdinout", {"inputs":[blocks[i][j][0]], "command_line":["cat"]}, 1);
    return ignore;

