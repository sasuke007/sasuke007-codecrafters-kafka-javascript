export class Header {
    constructor(requestApiKey, requestApiVersion, correlationId) {
        this.requestApiKey = requestApiKey;
        this.requestApiVersion = requestApiVersion;
        this.correlationId = correlationId;
    }
}

export class Response {
    constructor(messageSize,errorCode,responseBody) {
        this.messageSize = messageSize;
        this.errorCode = errorCode;
        this.responseBody = responseBody;
    }
}

export class ResponseBody{
    constructor(apiKey,maxVersion) {
        this.apiKey = apiKey;
        this.maxVersion = maxVersion;
    }
}

export class RequestBody {
    constructor(messageSize, header, body) {
        this.messageSize = messageSize;
        this.header = header;
        this.body = body;
    }
}