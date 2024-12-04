import net from "net";


// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

const UNSUPPORTED = 35;
const NULL_TAG = Buffer.from([0]);
const CURSOR_TAG = Buffer.from([255]);

class ClientId {
    constructor(length, clientName, headerEndingOffset) {
        this.length = length;
        this.clientName = clientName;
        this.headerEndingOffset = headerEndingOffset;
    }
}

class Header {
    constructor(messageSize, apiKey, apiVersion, correlationId, clientId) {
        this.messageSize = messageSize;
        this.apiKey = apiKey;
        this.apiVersion = apiVersion;
        this.correlationId = correlationId;
        this.clientId = clientId;
    }
}

const readUtf8StringOfLength = (data, offset, length) => {
    let str = String();
    for (let i = 0; i < length; i++) {
        let letter = data.readInt8(offset);
        str += String.fromCharCode(letter);
        ++offset;
    }
    return str;
}

const getClientId = (data) => {
    let length = data.readInt16BE(12);
    let offset = 14;
    let clientName = readUtf8StringOfLength(data, offset, length);
    return new ClientId(length, clientName, offset + length);
}
// Parse request
const parseRequest = (data) => {
    const messageSize = data.readInt32BE(0);
    const requestApiKey = data.readInt16BE(4);
    const requestApiVersion = data.readInt16BE(6);
    const correlationId = data.readInt32BE(8);
    const clientId = getClientId(data);
    return new Header(messageSize, requestApiKey, requestApiVersion, correlationId, clientId);
}

const toBufferFromInt8 = (value) => Buffer.from([value]);

const toBufferFromInt16BE = (value) => {
    const buf = Buffer.alloc(2);
    buf.writeInt16BE(value);
    return buf;
};

const toBufferFromInt128 = (value) => {
    const buf = Buffer.alloc(16);
    //buf.writeBigUint64BE(value);
    return buf;
}

const toBufferFromInt32BE = (value) => {
    const buf = Buffer.alloc(4);
    buf.writeInt32BE(value);
    return buf;
};

const processApiVersionRequest = (header, body) => {

    const valid = header.apiVersion >= 0 && header.apiVersion <= 4;
    const errorCode = valid ? 0 : UNSUPPORTED;
    const maxVersion = 4;
    const minVersion = 0;
    const throttleTime = 0;
    const responseBuffer = Buffer.concat([
        toBufferFromInt16BE(errorCode),
        toBufferFromInt8(3), // Number of API keys (hardcoded to 2 for this example)
        toBufferFromInt16BE(header.apiKey),
        toBufferFromInt16BE(minVersion), // Min version
        toBufferFromInt16BE(maxVersion),
        NULL_TAG,
        toBufferFromInt16BE(75), // ApiVersions key
        toBufferFromInt16BE(0), // Min version for ApiVersions
        toBufferFromInt16BE(0),
        NULL_TAG,// Max version for ApiVersions
        toBufferFromInt32BE(throttleTime),
        NULL_TAG
    ]);
    const size = toBufferFromInt32BE(header.correlationId).length + responseBuffer.length;
    console.log("size", size);
    console.log("header size", toBufferFromInt32BE(header.correlationId).length);
    console.log("body size", responseBuffer.length);
    console.log("null tag size", NULL_TAG.length);
    return Buffer.concat([toBufferFromInt32BE(size), toBufferFromInt32BE(header.correlationId), responseBuffer]);
}

class DescribeTopicPartitionsRequestBody {
    constructor(topics, responsePartitionLimit) {
        this.responsePartitionLimit = responsePartitionLimit;
        this.topics = topics;
    }
}

class Topic {
    constructor(topicNameLength, topicName) {
        this.topicNameLength = topicNameLength;
        this.topicName = topicName;
    }
}

const getDescribeTopicPartitionsRequestBody = (rawData, offset) => {
    offset++; // avoiding tag buffer from header.
    const arrayLength = rawData.readInt8(offset);
    offset++;
    const topics = [];
    for (let i = 0; i < arrayLength - 1; i++) {
        const topicNameLength = rawData.readInt8(offset) - 1;
        offset++;
        const topicName = readUtf8StringOfLength(rawData, offset, topicNameLength);
        offset = offset + topicNameLength;
        const topic = new Topic(topicNameLength, topicName);
        topics.push(topic);
        offset++;
    }
    const responsePartitionLimit = rawData.readInt32BE(offset);
    offset += 4;
    offset++; // cursor field
    offset++; // null tag.
    return new DescribeTopicPartitionsRequestBody(topics, responsePartitionLimit);
}

const processDescribeTopicPartitions = (header, rawData) => {
    const requestBody = getDescribeTopicPartitionsRequestBody(rawData, header.clientId.headerEndingOffset);
    console.log("processing topic partitions");
    const responseHeader = Buffer.concat([toBufferFromInt32BE(header.correlationId), NULL_TAG]);
    const throttleTime = toBufferFromInt32BE(0);
    const arrayLength = toBufferFromInt8(2);
    const errorCode = toBufferFromInt16BE(3); // 3 for unknown topic.
    const topicNameLength = toBufferFromInt8(requestBody.topics[0].topicNameLength + 1);
    const topicName = Buffer.from(requestBody.topics[0].topicName, 'utf8');
    const topicId = toBufferFromInt128(0);
    const isInternal = NULL_TAG;
    const partitionsArray = NULL_TAG;
    const topicAuthorizedOperations = toBufferFromInt32BE(0);
    const responseBody = Buffer.concat([throttleTime, arrayLength, errorCode, topicNameLength, topicName,
        topicId, isInternal, partitionsArray, topicAuthorizedOperations, NULL_TAG, CURSOR_TAG, NULL_TAG]);
    return Buffer.concat([toBufferFromInt32BE(responseHeader.length + responseBody.length), responseHeader, responseBody]);
}

const errorHandler = (requestBody) => {
    console.log("error handler");
}

const requestProcessor = (header, body) => {
    switch (header.apiKey) {
        case 18:
            return processApiVersionRequest(header, body);
        case 75:
            return processDescribeTopicPartitions(header, body);
        default:
            return errorHandler(header, body);
    }
}
// Uncomment this block to pass the first stage
const server = net.createServer((connection) => {
    connection.on("data", (data) => {
        try {
            console.log("Request:", data.toString("hex"));
            const header = parseRequest(data);
            const response = requestProcessor(header, data);
            connection.write(response);
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
