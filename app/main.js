import net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
    let arr = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 7]);
    connection.on("data", (data ) => {
        // console.log(data.subarray(8, 13));
        connection.write(data.subarray(8, 12));
    });
});

server.listen(9092, "127.0.0.1");
