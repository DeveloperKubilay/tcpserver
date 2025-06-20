var url = "ws://142.250.187.174:80"
var port = 85
var id = "name"

const socketio = require('socket.io-client')
const net = require('net');
const io = socketio(url, { auth: { id: id } });
var connections = []

io.on('connect', () => {
    console.log("connectted")
    io.on("newclient", function (msg) {
        if (msg.to == id) {
            const server = net.createConnection(port)
            connections.push({
                id: msg.id,
                to: msg.socket,
                server: server
            })
            server.on('data', function (data) {
                io.emit("message", { data: data, id: msg.id, to: msg.socket })
            });

        }
    })
    io.on("catch", function (data) {
        if (data.id == id)
            io.emit("startit", { socket: data.socket, data: connections.length })

    })
    io.on("message", function (msg) {
        var a = connections.find((x) => x.id == msg.id)
        if (a) a.server.write(msg.data)
    })
    io.on("logout", function (msg) {
        var aacs = connections.find((x) => x.to == msg.socket)
        if (!aacs) return;

        aacs.server.end();
        connections.splice(connections.indexOf(aacs), 1)
    })
})
