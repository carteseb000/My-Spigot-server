var io = require('socket.io').listen(8080),
    proc = require('child_process'),
    servers = require('./servers'),
    server = null,
    mc_server = null;
io.sockets.on('connection', function(socket) {
    socket.on('get_server_list', function() {
            socket.emit('status', server);
    });

    socket.on('get_status', function() {
        socket.emit('status', server);
    }); // end of get_status

    socket.on('start_server', function(name) {
        if (mc_server || !server[name]) {
            socket.emit('fail', 'start_server');

            return;
        }
        server = name;

        mc_server = proc.spawn(
            "java",
            ['-Xms512M', '-Xmx512M', '-jar', 'server/spigot-1.14.jar', 'nogui'],

            { cwd: "C:/Program\ Files\ (x86)/Minecraft/_"+ servers[server] }
        );

        io.sockets.emit('status', server);

        mc_server.stdout.on('data', function(data) {
            if(data) {
                io.sockets.emit('console', ""+data);
            }
        });
        mc_server.stderr.on('data', function(data) {
            if(data) {
                io.sockets.emit('console', ""+data);
            }
        });
        mc_server.on('exit', function() {
            mc_server = server = null;
            io.sockets.emit('status', null);
        });
    }); // end of start_server
    
    socket.on('command', function(cmd) {
        if(mc_server){
            io.sockets.emit('console', "Player Command: " + cmd);
        } else {
            socket.emit('fail', cmd);
        }
    });
});

process.stdin.resume();
process.stdin.on('data', function(data) {
    if(mc_server) {
        mc_server.stdin.write(data);
    }
});
