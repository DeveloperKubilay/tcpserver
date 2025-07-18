var port = 8080  // Safe port - tarayıcı engellemez
var url = "ws://localhost:62231"
var id = "rdp_client_" + Date.now()  // Unique ID

const socketio = require('socket.io-client')
const net = require('net');
const io = socketio(url, {
    auth: {id: id},
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 5000
});
var ltnidd = 0
var da = Date.now()
var connections = []

io.on('connect_error', (error) => {
    console.log('🚫 Bağlantı hatası:', error.message);
});

io.on('connect', () => {
    console.log("🚀 connectted server", Date.now() - da)
    console.log("📡 Client ID:", id)
    da = Date.now()
    io.emit("catch", { id: "rdp_server", socket: io.id })  // Server'ın ID'sini gönder
    console.log("📤 catch eventi gönderildi")
    
    io.on("startit", function (msg) {
        console.log("🔌 startit eventi alındı!")
        console.log("📋 Msg:", msg)
        console.log("🔌 connectted proxy", Date.now() - da)
        if (msg.socket != io.id) return;
        ltnidd = msg.data
        
        console.log("sa")
        const server = net.createServer((sourceSocket) => {
            var ltnid = ltnidd++;
            
            const connectionObj = {
                id: ltnid,
                socket: sourceSocket,
                createdAt: Date.now()
            };
            connections.push(connectionObj);
            
            io.emit("newclient", {
                id: ltnid,
                socket: io.id,
                to: "rdp_server"  // Server'a gönder
            })

            io.on("message", function (msg) {
                try {
                    if (msg.id == ltnid && sourceSocket.writable) {
                        sourceSocket.write(msg.data);
                    }
                } catch (err) {
                    console.log(`🚫 Veri yazma hatası (ID: ${ltnid}):`, err.message);
                }
            })

            sourceSocket.on('data', (data) => {
                try {
                    io.emit("_msg", { to: "rdp_server", id: ltnid, data: data });
                } catch (err) {
                    console.log(`🚫 Veri gönderme hatası (ID: ${ltnid}):`, err.message);
                }
            });
            
            sourceSocket.on('end', () => {
                console.log(`🔌 Socket bağlantısı sonlandı (ID: ${ltnid})`);
                cleanupConnection(connectionObj);
                io.emit("logout", { to: "rdp_server", socket: io.id });
            });
            
            sourceSocket.on('error', (err) => {
                console.log(`🚫 Socket hatası (ID: ${ltnid}):`, err.message);
                cleanupConnection(connectionObj);
            });
        });
        
        server.listen(port, () => {
            console.log(`📡 TCP Server dinliyor - port: ${port}`);
        });
        
        server.on('error', (err) => {
            console.log('🚫 Server hatası:', err.message);
        });
    })
    
    function cleanupConnection(connection) {
        try {
            if(connection.socket) {
                if(connection.socket.writable) connection.socket.end();
                connection.socket.destroy();
            }
            const index = connections.indexOf(connection);
            if(index !== -1) {
                connections.splice(index, 1);
                console.log(`🗑️ Bağlantı temizlendi (ID: ${connection.id})`);
            }
        } catch (err) {
            console.log('🚫 Bağlantı temizleme hatası:', err.message);
        }
    }
})

io.on('disconnect', (reason) => {
    console.log('🔌 Bağlantı kesildi:', reason);
    
    connections.forEach(conn => {
        try {
            if(conn.socket) {
                if(conn.socket.writable) conn.socket.end();
                conn.socket.destroy();
            }
        } catch (e) {
            console.log('🚫 Kapanış hatası:', e.message);
        }
    });
    connections = [];
});