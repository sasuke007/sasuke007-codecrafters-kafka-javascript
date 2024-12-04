import net from "net";
import something from "./something.js";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
    something(connection);
});
server.listen(9092, "127.0.0.1");
