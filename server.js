const net = require("net");
const server = net.createServer();


const password = "pass"




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

server.on("connection", (clientToProxySocket) => {
    clientToProxySocket.once("data", (data) => {
        if (data.toString().indexOf("CONNECTSW") !== -1 && data.toString().indexOf(password) !== -1) {  
            serve = clientToProxySocket;
            clientToProxySocket.on("data", (data) => {
                const id = bufferToNumber4(data.slice(0, 5))
                if(id.bit == 1){
                    try{ connections[id.number]?.end() }catch{}
                    delete connections[id.number]
                }else{
                    const connection = connections[id.number]
                    if(!connection) return;
                    connection.write(data.slice(5));
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
   
        const myid  = id;
        const idstr = numberToBuffer4(myid,0)
        id++;
        connections[myid] = clientToProxySocket;
        serve.write(
            Buffer.concat(
                [Buffer.from(idstr),data]
            )
        );

        clientToProxySocket.on("data", (data) => {
            return serve.write(
                Buffer.concat(
                    [Buffer.from(idstr), data]
                )
            );   
        }); 

        clientToProxySocket.on("close", () => {
            serve.write(numberToBuffer4(myid,1))
            delete connections[myid]
        })
        clientToProxySocket.on("error", () => {
            serve.write(numberToBuffer4(myid,1))
            delete connections[myid]
        })
    });
 
 
});

server.on("error", () => {});
server.on("close", () => {});
server.listen(8080);