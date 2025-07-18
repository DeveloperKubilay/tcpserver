
const io = require('socket.io')(62231, {
  pingTimeout: 30000,
  pingInterval: 10000,
  cors: {
    origin: "*", // CORS koruması 🔒
    methods: ["GET", "POST"]
  }
});
var servers = {}
const startTime = Date.now();

// Performans izleme
console.log('🚀 Socket.io sunucu başlatıldı - port: 62231 | ' + new Date().toLocaleString());

// Sunucu durum takibi için sayaçlar
let stats = {
  totalConnections: 0,
  activeConnections: 0,
  messagesProcessed: 0,
  errors: 0
}

io.on('connection', (socket) => {
    stats.totalConnections++;
    stats.activeConnections++;
    console.log(`🔌 Yeni bağlantı: ${socket.id} (Aktif: ${stats.activeConnections})`);
    
    if (socket.handshake.auth.id) {
        servers[socket.handshake.auth.id] = socket.id;
        console.log(`👤 Kullanıcı kaydedildi: ${socket.handshake.auth.id}`);
    }
    
    socket.on('error', (err) => {
        stats.errors++;
        console.log(`🚫 Socket hatası (${socket.id}):`, err.message);
    });
    
    socket.on('disconnect', (reason) => {
        stats.activeConnections--;
        console.log(`🔌 Bağlantı kesildi (${socket.id}): ${reason} (Aktif: ${stats.activeConnections})`);
        // ID'yi temizle
        for (let key in servers) {
            if (servers[key] === socket.id) {
                console.log(`👤 Kullanıcı silindi: ${key}`);
                delete servers[key];
                break;
            }
        }
    });
    
    socket.on("newclient", msg => {
        try {
            stats.messagesProcessed++;
            io.to(servers[msg.to]).emit("newclient", msg);
        } catch (err) {
            stats.errors++;
            console.log('🚫 newclient gönderme hatası:', err.message);
        }
    });
    
    socket.on("catch", msg => {
        try {
            stats.messagesProcessed++;
            console.log('📥 catch eventi alındı:', msg);
            console.log('🔍 servers objesi:', servers);
            console.log('🎯 Hedef socket ID:', servers[msg.id]);
            io.to(servers[msg.id]).emit("catch", msg);
        } catch (err) {
            stats.errors++;
            console.log('🚫 catch gönderme hatası:', err.message);
        }
    });
    
    socket.on("message", msg => {
        try {
            stats.messagesProcessed++;
            io.to(msg.to).emit("message", msg);
        } catch (err) {
            stats.errors++;
            console.log('🚫 message gönderme hatası:', err.message);
        }
    });
    
    socket.on("startit", msg => {
        try {
            stats.messagesProcessed++;
            io.to(msg.socket).emit("startit", msg);
        } catch (err) {
            stats.errors++;
            console.log('🚫 startit gönderme hatası:', err.message);
        }
    });
    
    socket.on("_msg", msg => {
        try {
            stats.messagesProcessed++;
            io.to(servers[msg.to]).emit("message", msg);
        } catch (err) {
            stats.errors++;
            console.log('🚫 _msg gönderme hatası:', err.message);
        }
    });
    
    socket.on("logout", msg => {
        try {
            stats.messagesProcessed++;
            io.to(servers[msg.to]).emit("logout", msg);
        } catch (err) {
            stats.errors++;
            console.log('🚫 logout gönderme hatası:', err.message);
        }
    });
})

// Her saat başı sunucu durumunu raporla
setInterval(() => {
  const uptime = (Date.now() - startTime) / 1000 / 60; // Dakika
  console.log(`📊 Sunucu Durumu - Çalışma Süresi: ${uptime.toFixed(2)} dakika | Bağlantı: ${stats.activeConnections}/${stats.totalConnections} | İşlenen mesaj: ${stats.messagesProcessed} | Hatalar: ${stats.errors}`);
}, 60 * 60 * 1000); // Her saat