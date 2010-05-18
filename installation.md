Getting Started
===============

Downloading
-----------

Development versions of Skywriting are stored on [Github](http://github.com), with the main repository available [here](http://github.com/mrry/skywriting):

    :::bash
    $ git checkout http://github.com/mrry/skywriting.git

Check this repository out, and then compile and install it using PyPi:

    :::bash
    $ python setup.py install

This will install the Python libraries, as well as the helper scripts `sw-master`, `sw-worker` and `sw-job`, which are explained below.

TODO: java setup

Concepts
--------

Skywriting uses a master/worker architecture, and so you will need to set up a single master instance, and as many workers as you have machines/cores in your cluster.
Communication between these instances happens using HTTP POST and a simple JSON RPC format.

### Master Setup

The `sw-master` command sets up a master server listening on a port, using the fully-qualified domain name of the host.

    sw-master [-p port]

Note that it does not listen on `localhost` by default, and so you should use the FQDN to address the node.
It defaults to port `8080`, and do not forget to open up a hole in your firewall so that other worker nodes in the cluster can also see the master.

### Worker Setup

Each worker runs on its own process and port, where it listens for jobs to be dispatched to it by the master process.
Workers need to be able to see the master port, and also to receive connections from the master server, so ensure your firewall is suitably configured.
Workers never directly communication with each other.

To get started with a single worker, type in:

    sw-worker -m <master uri> -p <port>

### Job Submission

Now that you have a master and some workers, it is time to submit a job for parallel processing.  There is a script to get you started in `src/sw/helloworld.sw`:

    :::javascript
    function hello(who) {
        return "hello " + who;
    }

    greeting = spawn(hello,["world"]);
    return *greeting;

This illustrates the Javascript-like syntax of Skywriting, and spawns a task which return a static greeting string.
Of course, you could return the string directly without the intermediate function, but using one lets us test that your master/worker setup is functioning correctly.

Submit the job by running:

   sw-job -m <master uri> <script file>

Currently a lot of debugging information gets emitted, this will be quietened as development settles down.

Interactive Console
-------------------

TODO: REPL information
