import http from 'http';
import url  from 'url';
import { StringDecoder } from 'string_decoder'

import handlers from './lib/handlers.mjs';
import { isNumber, parseJsonToObject } from './helpers/utils.mjs';

export const server = {}

server.httpServer = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const queries = parsedUrl.query;
    const headers = req.headers;
    const method = req.method.toLocaleLowerCase();

    const decoder = new StringDecoder('utf-8');

    let buffer = '';

    req.on('data', (data) => buffer += decoder.write(data));

    req.on('end', () => {
        buffer += decoder.end();

        const data = { method, trimmedPath, queries, headers, payload: parseJsonToObject(buffer)};

        const currentHandler = this.routes[trimmedPath] ? handlers[trimmedPath] : handlers.notFound;

        currentHandler(data, (statusCode, payload) => {
            statusCode = isNumber(statusCode) ? statusCode : 200;
            payload = typeof(payload) === "object" ? payload : {};
            const payloadString = JSON.stringify(payload)

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
});

server.init = () => server.httpServer.listen(3000, () => console.log('Server running on port 3000'));

server.routes = {
    'users': handlers.users,
    'token': handlers.token,
    'checks': handlers.checks
}