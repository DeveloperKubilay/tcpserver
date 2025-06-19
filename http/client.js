const WebSocket = require('ws');
const net = require('net');

const WS_SERVER = 'ws://'+process.argv[3] || 'localhost:8080';
const LOCAL_PORT = process.argv[2] || 82;
const CONNECTION_TIMEOUT = 30000;

const server = net.createServer((socket) => {
    const ws = new WebSocket(WS_SERVER, {
        perMessageDeflate: false
    });
    let wsConnected = false;
    let pendingData = [];
    
    socket.setTimeout(CONNECTION_TIMEOUT);
    
    socket.on('timeout', () => {
        socket.end();
    });
    
    ws.on('open', () => {
        wsConnected = true;
        
        if (pendingData.length > 0) {
            pendingData.forEach(data => ws.send(data, { binary: true }));
            pendingData = [];
        }
    });
    
    ws.on('message', (data) => {
        try {
            if (!socket.destroyed) {
                socket.write(data);
            }
        } catch (err) {
            console.error(`❌ Veri yazma hatası: ${err.message}`);
        }
    });
    
    socket.on('data', (data) => {
        if (wsConnected && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(data, { binary: true });
            } catch (err) {
                console.error(`❌ Veri gönderme hatası: ${err.message}`);
            }
        } else {
            pendingData.push(data);
        }
    });
    
    socket.on('close', () => {
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }, 1000);
    });
    
    socket.on('error', (err) => {
        if (err.code !== 'ECONNRESET' && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
    
    ws.on('close', () => {
        wsConnected = false;
        if (!socket.destroyed) {
            socket.end();
        }
    });
    
    ws.on('error', (err) => {
        wsConnected = false;
        if (!socket.destroyed) {
            socket.end();
        }
    });
});

server.on('close', () => {
    console.log('⚠️ Sunucu kapandı! 3 saniye sonra yeniden başlatılacak...');
    setTimeout(() => {
        try {
            server.listen(LOCAL_PORT, () => {
                console.log(`🔄 TCP sunucusu yeniden başlatıldı ve ${LOCAL_PORT} portunda dinleniyor!`);
            });
        } catch (err) {
            console.error(`❌ Sunucu yeniden başlatılamadı: ${err.message}`);
        }
    }, 3000);
});

server.listen(LOCAL_PORT, () => {
    console.log(`🚀 TCP sunucusu ${LOCAL_PORT} portunda başlatıldı!`);
});

server.on('error', (err) => {
    console.error(`❌ Sunucu hatası: ${err.message}`);
});
  