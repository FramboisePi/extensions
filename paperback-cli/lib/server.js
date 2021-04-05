"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const fs = require("fs");
const path = require("path");
const utils_1 = require("./utils");
const chalk_1 = require("chalk");
class Server {
    constructor(port) {
        this.port = port;
    }
    start() {
        if (this.server) {
            utils_1.default.error('Server already running');
            return;
        }
        this.server = http.createServer(function (request, response) {
            utils_1.default.log(`Request ${request.url}`);
            let filePath = './bundles' + request.url;
            if (filePath === './') {
                filePath = './index.html';
            }
            const extname = String(path.extname(filePath)).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.wav': 'audio/wav',
                '.mp4': 'video/mp4',
                '.woff': 'application/font-woff',
                '.ttf': 'application/font-ttf',
                '.eot': 'application/vnd.ms-fontobject',
                '.otf': 'application/font-otf',
                '.wasm': 'application/wasm',
            };
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            fs.readFile(filePath, function (error, content) {
                if (error) {
                    if (error.code === 'ENOENT') {
                        response.writeHead(404);
                        response.end('Page not found: ' + error.code + ' ..\n');
                    }
                    else {
                        response.writeHead(500);
                        response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                    }
                }
                else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }).listen(this.port);
        utils_1.default.log(`Server running at ${chalk_1.default.green(`http://127.0.0.1:${this.port}/versioning.json`)}`);
    }
    stop() {
        var _a;
        if (this.server === undefined) {
            utils_1.default.error('Server not running');
            return;
        }
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
        this.server = undefined;
    }
}
exports.default = Server;
