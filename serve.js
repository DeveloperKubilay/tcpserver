const net = require("net");
const server = net.createServer();

const PORT = process.env.PORT || process.argv[2] || 8080;
const password = process.env.PASSWORD || process.argv[3] || "pass";

var serve = undefined;
const connections = {}
var id = 0

function numberToBuffer4(number, bit) {
    const buffer = Buffer.alloc(5);
    for (let i = 3; i >= 0; i--) {
        buffer[i] = number & 0xFF; 
        number = number >> 8;  
    }
    buffer[4] = bit ? 1 : 0; 
    return buffer;
}
function bufferToNumber4(buffer) {
    let number = 0;
    for (let i = 0; i < 4; i++) {
        number |= buffer[i] << (8 * (3 - i)); 
    }
    const bit = buffer[4] ? 1 : 0;
    return { number, bit }; 
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

server.on("connection", (clientToProxySocket) => {
    clientToProxySocket.once("data", (data) => {
        if (data.toString().indexOf("CONNECTSW") !== -1 && data.toString().indexOf(password) !== -1) {  
            serve = clientToProxySocket;
            
            const sequenceBuffers = {};
            const expectedSequences = {};
            
            clientToProxySocket.on("data", (data) => {
                const id = bufferToNumber4(data.slice(0, 5));
                
                if(id.bit == 1){
                    try{ connections[id.number]?.end() }catch{}
                    delete connections[id.number];
                    delete sequenceBuffers[id.number];
                    delete expectedSequences[id.number];
                    return;
                }
                
                const seqNum = bufferToNumber2(data.slice(5, 7));
                const connection = connections[id.number];
                if(!connection) return;
                
                if(expectedSequences[id.number] === undefined) {
                    expectedSequences[id.number] = seqNum;
                    sequenceBuffers[id.number] = {};
                }
                
                if(seqNum === expectedSequences[id.number]) {
                    connection.write(data.slice(7));
                    expectedSequences[id.number] = (seqNum + 1) % 65536;
                    
                    let nextSeq = expectedSequences[id.number];
                    while(sequenceBuffers[id.number][nextSeq]) {
                        connection.write(sequenceBuffers[id.number][nextSeq]);
                        delete sequenceBuffers[id.number][nextSeq];
                        expectedSequences[id.number] = (nextSeq + 1) % 65536;
                        nextSeq = expectedSequences[id.number];
                    }
                } else {
                    sequenceBuffers[id.number][seqNum] = data.slice(7);
                }
            })
            clientToProxySocket.on("close", () => 
                serve = undefined
            )
            clientToProxySocket.on("error", () => 
                serve = undefined
            )
            return;
        } 

        if(!serve) 
            return clientToProxySocket.end();
   
        const myid = id;
        const idstr = numberToBuffer4(myid, 0);
        id++;
        connections[myid] = clientToProxySocket;
        
        let sequence = 0;
        
        serve.write(
            Buffer.concat(
                [Buffer.from(idstr), numberToBuffer2(sequence++), data]
            )
        );

        clientToProxySocket.on("data", (data) => {
            return serve.write(
                Buffer.concat(
                    [Buffer.from(idstr), numberToBuffer2(sequence++ % 65536), data]
                )
            );   
        }); 

        clientToProxySocket.on("close", () => {
            serve.write(numberToBuffer4(myid, 1));
            delete connections[myid];
        })
        clientToProxySocket.on("error", () => {
            serve.write(numberToBuffer4(myid, 1));
            delete connections[myid];
        })
    });
 
 
});

server.on("error", () => {});
server.on("close", () => {});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})