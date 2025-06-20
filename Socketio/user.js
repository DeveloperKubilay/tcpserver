var port = 100
var url = "ws://142.250.187.174:80"
var id = "name"

const socketio = require('socket.io-client')
const net = require('net');
const io = socketio(url);
var ltnidd = 0
var da = Date.now()
io.on('connect', () => {
    console.log("connectted server", Date.now() - da)
    da = Date.now()
    io.emit("catch", { id: id, socket: io.id })
    io.on("startit", function (msg) {
        console.log("connectted proxy", Date.now() - da)
        if (msg.socket != io.id) return;
        ltnidd = msg.data
        net.createServer((sourceSocket) => {
            var ltnid = ltnidd++;
            io.emit("newclient", {
                id: ltnid,
                socket: io.id,
                to: id
            })


            io.on("message", function (msg) {
                if (msg.id == ltnid) sourceSocket.write(msg.data)
            })

            sourceSocket.on('data', (data) => io.emit("_msg", { to: id, id: ltnid, data: data }));
            sourceSocket.on('end', () => io.emit("logout", { to: id, socket: io.id }));
        }).listen(port);
    })
})
