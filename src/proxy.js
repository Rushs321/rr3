"use strict";
import fetch from 'node-fetch';
import lodash from 'lodash';
import { generateRandomIP, randomUserAgent } from './utils.js';
import { copyHeaders as copyHdrs } from './copyHeaders.js';
import { compressImg as applyCompression } from './compress.js';
import { bypass as performBypass } from './bypass.js';
import { redirect as handleRedirect } from './redirect.js';
import { shouldCompress as checkCompression } from './shouldCompress.js';

const viaHeaders = [
    '1.1 example-proxy-service.com (ExampleProxy/1.0)',
    '1.0 another-proxy.net (Proxy/2.0)',
    '1.1 different-proxy-system.org (DifferentProxy/3.1)',
    '1.1 some-proxy.com (GenericProxy/4.0)',
];

function randomVia() {
    const index = Math.floor(Math.random() * viaHeaders.length);
    return viaHeaders[index];
}

export async function processRequest(request, reply) {
    let url = request.query.url;
    const randomIP = generateRandomIP();
    const userAgent = randomUserAgent();
    const vid = randomVia();

    if (!url) {
        
        const hdrs = {
            ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
            'x-forwarded-for': randomIP,
            'user-agent': userAgent,
            'via': vid,
        };

        Object.entries(hdrs).forEach(([key, value]) => reply.header(key, value));
        
        return reply.send(`bandwidth-hero-proxy`);
    }


    request.params.url = decodeURIComponent(url);
    request.params.webp = !request.query.jpeg;
    request.params.grayscale = request.query.bw != '0';
    request.params.quality = parseInt(request.query.l, 10) || 40;

    

    try {
        const response = await fetch(request.params.url, {
            method: "GET",
            headers: {
                ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
               'x-forwarded-for': randomIP,
               'user-agent': userAgent,
               'via': vid,
            },
            timeout: 10000,
            follow: 5, // max redirects
            compress: false,
        });

        if (!response.ok) {
            return handleRedirect(request, reply);
        }

        copyHdrs(response, reply);
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers.get('content-type') || '';
        request.params.originSize = response.headers.get('content-length'), 10 || 0;

        const input = { body: response.body }; // Wrap the stream in an object

        if (checkCompression(request)) {
            return applyCompression(request, reply, input);
        } else {
            return performBypass(request, reply, response.body);
        }
    } catch (err) {
        return handleRedirect(request, reply);
    }
}
