const http = require('http');
const fs = require('fs');
const port = 8085;

log('Starting server on port ' + port + ' ...');
http.createServer((req, res) => {
    log('Incoming request ' + req.url);
    resolveUrl(req, res);
}).listen(port);
log('Server is running');

function resolveUrl(req, res) {
    if (req.url === '/') {
        loadFile('index.html', res);
    } else if (req.url === '/rest/metadata') {
        res.writeHead(200, {'ContentType': resolveContentType('json')});
        res.write('{"version":"1.0.9"}');
        res.end();
    } else {
        loadFile('.' + req.url, res);
    }
}

function loadFile(path, res) {
    fs.readFile(path, (err, data) => {
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
    console.log('msw: ' + str);
}
