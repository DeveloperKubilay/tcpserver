var url = "ws://localhost:62231"
var port = 8090  // RDP target port
var id = "rdp_server"

const socketio = require('socket.io-client')
const net = require('net');
const io = socketio(url, {
    auth: {id: id},
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 5000 // Bağlantı zaman aşımı eklendi 🔄
});
var connections = []

// Bağlantı hata yakalama
io.on('connect_error', (error) => {
    console.log('🚫 Bağlantı hatası:', error.message);
});

io.on('connect', () => {
  console.log("connectted 🚀")
  
  io.on("newclient", function(msg) {
    if(msg.to == id) {
      try {
        const server = net.createConnection({
          port: port,
          timeout: 30000 // Daha düzgün timeout ayarı 💯
        });
        const connectionObj = {
          id: msg.id,
          to: msg.socket,
          server: server,
          createdAt: Date.now() // Ne zaman oluşturulduğunu takip et ⌚
        };
        
        // Hata yakalama
        server.on('error', (err) => {
          console.log(`🚫 Server bağlantı hatası (ID: ${msg.id}):`, err.message);
          cleanupConnection(connectionObj);
        });
        
        server.on('timeout', () => {
          console.log(`⏱️ Bağlantı timeout (ID: ${msg.id})`);
          cleanupConnection(connectionObj);
        });
        
        connections.push(connectionObj);
        
        server.on('data', function(data) {
          try {
            io.emit("message", {data: data, id: msg.id, to: msg.socket});
          } catch (err) {
            console.log(`🚫 Veri gönderme hatası (ID: ${msg.id}):`, err.message);
          }
        });
        
        server.on('end', () => {
          console.log(`🔌 Server bağlantısı sonlandı (ID: ${msg.id})`);
          cleanupConnection(connectionObj);
        });
      } catch (err) {
        console.log('🚫 Bağlantı kurulumu hatası:', err.message);
      }
    }
  });
  
  io.on("catch", function(data) {
    if(data.id == id)
      io.emit("startit", {socket: data.socket, data: connections.length});
  });
  
  io.on("message", function(msg) {
    try {
      var a = connections.find((x) => x.id == msg.id);
      if(a && a.server.writable) a.server.write(msg.data);
    } catch (err) {
      console.log(`🚫 Veri yazma hatası (ID: ${msg.id}):`, err.message);
    }
  });
  
  io.on("logout", function(msg) {
    var aacs = connections.find((x) => x.to == msg.socket);
    if(!aacs) return;
    
    cleanupConnection(aacs);
  });
  
  // Bağlantı temizleme fonksiyonu iyileştirildi
  function cleanupConnection(connection) {
    try {
      if(connection.server) {
        if(connection.server.writable) connection.server.end();
        connection.server.destroy(); // Tam temizlik için destroy ekledim 🧹
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
  
  // Her 5 dakikada bir aktif olmayan bağlantıları temizle
  setInterval(() => {
    const now = Date.now();
    const staleConnections = connections.filter(conn => now - conn.createdAt > 30 * 60 * 1000); // 30 dakikadan eski
    staleConnections.forEach(conn => {
      console.log(`⏱️ Eski bağlantı temizleniyor (ID: ${conn.id})`);
      cleanupConnection(conn);
    });
  }, 5 * 60 * 1000); // 5 dakika
});

// Bağlantı koptuğunda
io.on('disconnect', (reason) => {
  console.log('🔌 Bağlantı kesildi:', reason);
  
  // Tüm bağlantıları temizle
  connections.forEach(conn => {
    try {
      if(conn.server) {
        if(conn.server.writable) conn.server.end();
        conn.server.destroy();
      }
    } catch (e) {
      console.log('🚫 Kapanış hatası:', e.message);
    }
  });
  connections = [];
});