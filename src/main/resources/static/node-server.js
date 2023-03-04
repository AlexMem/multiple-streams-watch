const http = require('http');
const url = require('url');
const fs = require('fs');
const ws = require('ws');
const WebSocketServer = require('websocket').server;
const port = 8085;

log(`Starting server on port ${port} ...`);
const httpServer = http.createServer((req, res) => {
    log(`Incoming request ${req.url}`);
    resolveUrl(req, res);
}).listen(port, () => log('Server is running'));

const webSocketServer = new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections: false
});

webSocketServer.on('request', req => {
    if (!originIsAllowed(req.origin)) {
        req.reject();
        log(`WS connection from origin ${req.origin} rejected.`);
        return;
    }
    log(`WS connection from origin ${req.origin} allowed.`);

    let connection = req.accept('messaging', req.origin);
    connection.on('close', (code, description) => {
        log(`WS ${req.origin} disconnected (${code}: ${description})`);
    });
});

function originIsAllowed(origin) {
    return true;
}

function resolveUrl(req, res) {
    let parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/') {
        loadFile('index.html', res);
    } else if (parsedUrl.pathname === '/rest/metadata') {
        res.writeHead(200, {'ContentType': resolveContentType('json')});
        res.write('{"version":"1.0.9"}');
        res.end();
    } else if (parsedUrl.pathname === '/rest/publish') {
        let params = parsedUrl.query;
        webSocketServer.broadcastUTF(params.msg);
        res.writeHead(200, {'ContentType': resolveContentType('.html')});
        res.write(`Message was published: ${params.msg}`);
        res.end();
    } else {
        loadFile(`.${req.url}`, res);
    }
}

function loadFile(path, res) {
    fs.readFile(path, (err, data) => {
        if (err) {
            res.writeHead(404, {'ContentType': resolveContentType(path)});
            return res.end();
        }
        res.writeHead(200, {'ContentType': resolveContentType(path)});
        res.write(data);
        return res.end();
    });
}

function resolveContentType(path) {
    if (path?.endsWith('.html')) {
        return 'text/html';
    }
    if (path?.endsWith('.css')) {
        return 'text/css';
    }
    if (path?.endsWith('.png')) {
        return 'image/png';
    }
    if (path?.endsWith('.js')) {
        return 'text/javascript';
    }
    if (path?.endsWith('json')) {
        return 'application/json';
    }
    return '';
}

function log(str) {
    console.log(`msw ${new Date().toISOString()}: ${str}`);
}
