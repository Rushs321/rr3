"use strict";

export function bypass(request, reply, stream) {
    reply.header('x-proxy-bypass', 1);
    reply.header('content-length', contentLength);
    return reply.code(200).send(stream);
}
