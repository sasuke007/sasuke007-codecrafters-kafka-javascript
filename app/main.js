import net from "net";
import {Header, RequestBody} from "./request.js";

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

const UNSUPPORTED = 35;
const NULL_TAG = Buffer.from([0, 0]);

// Parse request
const parseRequest = (data) => {
    const messageSize = data.readUInt32BE(0);
    const requestApiKey = data.readUInt16BE(4);
    const requestApiVersion = data.readUInt16BE(6);
    const correlationId = data.readUInt32BE(8);
    return new RequestBody(messageSize, new Header(requestApiKey, requestApiVersion, correlationId), null);
}

const toBufferFromInt8 = (value) => Buffer.from([value]);

const toBufferFromInt16BE = (value) => {
    const buf = Buffer.alloc(2);
    buf.writeInt16BE(value);
    return buf;
};

const toBufferFromInt32BE = (value) => {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(value);
    return buf;
};

const processApiVersionRequest = (requestBody) => {
    const requestApiKey = requestBody.header.requestApiKey;
    const correlationId = requestBody.header.correlationId;
    const requestApiVersion = requestBody.header.requestApiVersion;
    const valid = 0 >= requestApiVersion && requestApiVersion <= 4;
    const errorCode = valid ? 0 : UNSUPPORTED;
    const maxVersion = 4;
    const minVersion = 0;
    const throttleTime = 0;
    const responseBuffer = Buffer.concat([toBufferFromInt32BE(correlationId),
        toBufferFromInt16BE(errorCode),
        toBufferFromInt8(1),
        toBufferFromInt16BE(requestApiKey),
        toBufferFromInt16BE(minVersion),
        toBufferFromInt16BE(maxVersion),
        toBufferFromInt32BE(throttleTime)]);
    return Buffer.concat([toBufferFromInt32BE(responseBuffer.length), responseBuffer]);
}

const errorHandler = (requestBody) => {
    let buffer = new Buffer([]);

}

const requestProcessor = (requestBody) => {
    switch (requestBody.header.requestApiKey) {
        case 18:
            return processApiVersionRequest(requestBody);
        default:
            return errorHandler(requestBody);
    }
}
// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
    connection.on("data", (data) => {
        const requestBody = parseRequest(data);
        const response = requestProcessor(requestBody);
        connection.write(response);
    });
});

server.listen(9092, "127.0.0.1");
