/// <reference types="node" />
import * as http from 'http';
export default class Server {
    server?: http.Server;
    port: number;
    constructor(port: number);
    start(): void;
    stop(): void;
}
