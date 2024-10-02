const net = require("net");




const shareport = 80  //like localhost:80 or 127.0.0.1:80
const server = "localhost:8080"
const password = "pass"



const connections = {}

function bufferToNumber4(buffer) {
    let number = 0;
    for (let i = 0; i < 4; i++) {
        number |= buffer[i] << (8 * (3 - i)); 
    }
    const bit = buffer[4] ? 1 : 0;
    return { number, bit }; 
}
function numberToBuffer4(number, bit) {
    const buffer = Buffer.alloc(5);
    for (let i = 3; i >= 0; i--) {
        buffer[i] = number & 0xFF; 
        number = number >> 8;  
    }
    buffer[4] = bit ? 1 : 0; 
    return buffer;
}

const clientToProxySocket = net.createConnection({host: server.split(":")[0], port: server.split(":")[1] }, () => {
    console.log("Connected to the server");
    
    clientToProxySocket.write("CONNECTSW "+password);

    clientToProxySocket.on("data", (buffer) => {
        const idbyte = buffer.slice(0, 5)
        const idt = bufferToNumber4(idbyte)
        if(idt.bit == 1 && connections[idt.number]){
            try{
            connections[idt.number]?.end()
            }catch{}
            delete connections[idt.number]
            return;
        }
        const id = idt.number
        const data = buffer.slice(5);
        const connection = connections[id]
        if(!connection){
            connections[id] = net.createConnection({ port: shareport }, () => {
                connections[id].write(data);
            });
            connections[id].on("data", (data) => {
                return clientToProxySocket.write(Buffer.concat([idbyte, data]));  
            });  
            connections[id].on("close", () => {
                clientToProxySocket.write(numberToBuffer4(idt.number,1))
                delete connections[id]
            });
            connections[id].on("error", () => {
                clientToProxySocket.write(numberToBuffer4(idt.number,1))
                delete connections[id]
            });
        }else connection.write(data);
    });
})