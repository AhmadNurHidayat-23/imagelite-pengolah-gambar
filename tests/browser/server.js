import http from 'node:http';
import { readFile } from 'node:fs/promises';

const files = {
    '/': new URL('./index.html', import.meta.url),
    '/suite.js': new URL('./suite.js', import.meta.url),
    '/image-processing.js': new URL('../../resources/js/image-processing.js', import.meta.url),
    '/image-rules.js': new URL('../../resources/js/image-rules.js', import.meta.url),
    '/image-input.js': new URL('../../resources/js/image-input.js', import.meta.url),
};

http.createServer(async (request, response) => {
    if (request.method !== 'GET' || !files[request.url]) {
        response.writeHead(404).end();
        return;
    }
    try {
        response.setHeader('Content-Type', request.url === '/' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8');
        response.end(await readFile(files[request.url]));
    } catch { response.writeHead(500).end(); }
}).listen(8015, '127.0.0.1', () => console.log('Pengujian browser: http://127.0.0.1:8015'));
