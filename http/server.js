const WebSocket = require('ws');
const net = require('net');

const port = process.argv[2]|| 80;

const wss = new WebSocket.Server({ 
    port: process.argv[3] || 8080,
    perMessageDeflate: false
});
console.log('🔥 WebSocket sunucusu başlatıldı!',process.argv[3] || 8080);

const CONNECTION_TIMEOUT = 30000;

wss.on('connection', (ws) => {
    let wsReady = false;
    let tcpConnected = false;
    let pendingData = [];
    
    const tcpClient = new net.Socket();
    
    tcpClient.setTimeout(CONNECTION_TIMEOUT);
    
    tcpClient.connect(port, 'localhost', () => {
        tcpConnected = true;
        wsReady = true;
        
        if (pendingData.length > 0) {
            pendingData.forEach(data => tcpClient.write(data));
            pendingData = [];
        }
    });
    
    tcpClient.on('data', (data) => {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data, { binary: true });
            }
        } catch (err) {
            console.error(`❌ Veri gönderme hatası: ${err.message}`);
        }
    });
    
    tcpClient.on('timeout', () => {
        tcpClient.end();
    });
    
    tcpClient.on('error', (err) => {
        if (err.code !== 'ECONNRESET' && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
    
    tcpClient.on('close', () => {
        tcpConnected = false;
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }, 1000);
    });
    
    ws.on('message', (message) => {
        if (tcpConnected) {
            tcpClient.write(message);
        } else {
            pendingData.push(message);
        }
    });
    
    ws.on('close', () => {
        wsReady = false;
        if (tcpConnected) {
            tcpClient.end();
        }
    });
    
    ws.on('error', (err) => {
        wsReady = false;
        if (tcpConnected) {
            tcpClient.destroy();
        }
    });
});
