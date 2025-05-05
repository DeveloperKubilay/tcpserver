const net = require("net");

const server = process.env.SERVERURL || process.argv[2] || "localhost:8080";
const password = process.env.PASSWORD || process.argv[3] || "pass";
const shareport = process.env.SHAREPORT || process.argv[4] || 80; 

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

function numberToBuffer2(number) {
    const buffer = Buffer.alloc(2);
    buffer[0] = (number >> 8) & 0xFF;
    buffer[1] = number & 0xFF;
    return buffer;
}

function bufferToNumber2(buffer) {
    return (buffer[0] << 8) | buffer[1];
}

const clientToProxySocket = net.createConnection({host: server.split(":")[0], port: server.split(":")[1] }, () => {
    console.log("Connected to the server");
    
    clientToProxySocket.write("CONNECTSW "+password);

    const sequences = {};
    const sequenceBuffers = {};
    const expectedSequences = {};
    
    clientToProxySocket.on("data", (buffer) => {
        const idbyte = buffer.slice(0, 5);
        const idt = bufferToNumber4(idbyte);
        
        if(idt.bit == 1 && connections[idt.number]){
            try{
                connections[idt.number]?.end();
            }catch{}
            delete connections[idt.number];
            delete sequences[idt.number];
            delete sequenceBuffers[idt.number];
            delete expectedSequences[idt.number];
            return;
        }
        
        const id = idt.number;
        
        const seqNum = bufferToNumber2(buffer.slice(5, 7));
        const data = buffer.slice(7);
        
        const connection = connections[id];
        
        if(!connection){
            sequences[id] = 0;
            expectedSequences[id] = seqNum;
            sequenceBuffers[id] = {};
            
            connections[id] = net.createConnection({ port: shareport }, () => {
                connections[id].write(data);
            });
            connections[id].on("data", (data) => {
                return clientToProxySocket.write(
                    Buffer.concat([idbyte, numberToBuffer2(sequences[id]++ % 65536), data])
                );  
            });  
            connections[id].on("close", () => {
                clientToProxySocket.write(numberToBuffer4(idt.number, 1));
                delete connections[id];
                delete sequences[id];
                delete sequenceBuffers[id];
                delete expectedSequences[id];
            });
            connections[id].on("error", () => {
                clientToProxySocket.write(numberToBuffer4(idt.number, 1));
                delete connections[id];
                delete sequences[id];
                delete sequenceBuffers[id];
                delete expectedSequences[id];
            });
        } else {
            if(expectedSequences[id] === undefined) {
                expectedSequences[id] = seqNum;
                sequenceBuffers[id] = {};
            }
            
            if(seqNum === expectedSequences[id]) {
                connection.write(data);
                expectedSequences[id] = (seqNum + 1) % 65536;
                
                let nextSeq = expectedSequences[id];
                while(sequenceBuffers[id][nextSeq]) {
                    connection.write(sequenceBuffers[id][nextSeq]);
                    delete sequenceBuffers[id][nextSeq];
                    expectedSequences[id] = (nextSeq + 1) % 65536;
                    nextSeq = expectedSequences[id];
                }
            } else {
                sequenceBuffers[id][seqNum] = data;
            }
        }
    });
})