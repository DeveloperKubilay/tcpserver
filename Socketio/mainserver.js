const io = require('socket.io')(80);
var servers = {}
io.on('connection', (socket) => {
    if (socket.handshake.auth.id) servers[socket.handshake.auth.id] = socket.id
    socket.on("newclient", msg => io.to(servers[msg.to]).emit("newclient", msg))
    socket.on("catch", msg => io.to(servers[msg.id]).emit("catch", msg))
    socket.on("message", msg => io.to(msg.to).emit("message", msg))
    socket.on("startit", msg => io.to(msg.socket).emit("startit", msg))
    socket.on("_msg", msg => io.to(servers[msg.to]).emit("message", msg))
    socket.on("logout", msg => io.to(servers[msg.to]).emit("logout", msg))
})
