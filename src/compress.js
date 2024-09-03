"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

export async function compressImg(request, reply, input) {
    const format = request.params.webp ? 'webp' : 'jpeg'

    try {
        const sharpInstance = sharp()
            .grayscale(request.params.grayscale)
            .toFormat(format, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: true
            });

        // Pipe the stream from input.body into the sharp instance
        input.body.pipe(sharpInstance);

        const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });

        reply
            .header('content-type', 'image/' + format)
            .header('content-length', info.size)
            .header('x-original-size', request.params.originSize)
            .header('x-bytes-saved', request.params.originSize - info.size)
            .code(200)
            .send(data);
    } catch (error) {
        return redirect(request, reply);
    }
}
