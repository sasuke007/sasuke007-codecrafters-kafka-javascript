import net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {

    connection.on("data", (data ) => {
        // console.log(data.subarray(8, 13));
        connection.write(new Uint8Array([0, 0, 0, 0, data[8], data[9], data[10], data[11]]));
    });
});

server.listen(9092, "127.0.0.1");
