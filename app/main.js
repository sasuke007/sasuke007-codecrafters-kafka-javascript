import net from "net";


// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

const UNSUPPORTED = 35;
const NULL_TAG = Buffer.from([0, 0]);

class Header {
    constructor(requestApiKey, requestApiVersion, correlationId) {
        this.requestApiKey = requestApiKey;
        this.requestApiVersion = requestApiVersion;
        this.correlationId = correlationId;
    }
}

class Response {
    constructor(messageSize, errorCode, responseBody) {
        this.messageSize = messageSize;
        this.errorCode = errorCode;
        this.responseBody = responseBody;
    }
}

class ResponseBody {
    constructor(apiKey, maxVersion) {
        this.apiKey = apiKey;
        this.maxVersion = maxVersion;
    }
}

class RequestBody {
    constructor(messageSize, header, body) {
        this.messageSize = messageSize;
        this.header = header;
        this.body = body;
    }
}

// Parse request
const parseRequest = (data) => {
    const messageSize = data.readUInt32BE(0);
    const requestApiKey = data.readUInt16BE(4);
    const requestApiVersion = data.readUInt16BE(6);
    const correlationId = data.readUInt32BE(8);
    return {requestApiKey, requestApiVersion, correlationId};
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
    const {requestApiKey, requestApiVersion, correlationId} = requestBody;
    const valid = 0 >= requestApiVersion && requestApiVersion <= 4;
    const errorCode = valid ? 0 : UNSUPPORTED;
    const maxVersion = 4;
    const minVersion = 0;
    const throttleTime = 0;
    const responseBuffer = Buffer.concat([
        toBufferFromInt16BE(errorCode),
        toBufferFromInt16BE(requestApiKey),
        toBufferFromInt16BE(minVersion),
        toBufferFromInt16BE(maxVersion),
        NULL_TAG,
        toBufferFromInt16BE(throttleTime),
        NULL_TAG
    ]);
    return Buffer.concat([toBufferFromInt32BE(correlationId), toBufferFromInt32BE(responseBuffer.length), responseBuffer]);
}

const errorHandler = (requestBody) => {
    console.log("error handler");
}

const requestProcessor = ({requestApiKey, requestApiVersion, correlationId}) => {
    switch (requestApiKey) {
        case 18:
            return processApiVersionRequest({requestApiKey, requestApiVersion, correlationId});
        default:
            return errorHandler({requestApiKey, requestApiVersion, correlationId});
    }
}
// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
    connection.on("data", (data) => {
        try {
            console.log("Request:", data.toString("hex"));
            const requestBody = parseRequest(data);
            const response = requestProcessor(requestBody);
            connection.write(response)
            console.log("ApiVersions response sent:", response.toString("hex"));
        } catch (error) {
            console.log(error);
        }
    });
    connection.on("end", () => {
        console.log("Client disconnected");
    });
});

server.listen(9092, "127.0.0.1");
