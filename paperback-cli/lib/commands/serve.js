"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const command_2 = require("../command");
const bundle_1 = require("./bundle");
const server_1 = require("../server");
const cli_ux_1 = require("cli-ux");
const utils_1 = require("../utils");
const chalk_1 = require("chalk");
class Serve extends command_2.default {
    async run() {
        var _a, _b;
        const { flags } = this.parse(Serve);
        // eslint-disable-next-line no-console
        console.clear();
        this.log(chalk_1.default.underline.blue('Building Sources'));
        // Make sure the repo is bundled
        await bundle_1.default.run();
        this.log();
        this.log(chalk_1.default.underline.blue('Starting Server on port ' + flags.port));
        const server = new server_1.default(flags.port);
        server.start();
        this.log();
        this.log(chalk_1.default `For a list of commands do {green h} or {green help}`);
        let stopServer = false;
        while (!stopServer) {
            // eslint-disable-next-line no-await-in-loop
            const input = (_b = (_a = (await cli_ux_1.default.prompt(utils_1.default.prefixTime(''), { required: false }))) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
            if (input === 'h' || input === 'help') {
                this.log(chalk_1.default.underline.bold('Help'));
                this.log('  h, help - Display this message');
                this.log('  s, stop - Stop the server');
                this.log('  r, restart - Restart the server, also rebuilds the sources');
            }
            if (input === 's' || input === 'stop') {
                stopServer = true;
            }
            if (input === 'r' || input === 'restart') {
                server.stop();
                // eslint-disable-next-line no-console
                console.clear();
                this.log(chalk_1.default.underline.blue('Building Sources'));
                // Make sure the repo is bundled
                // eslint-disable-next-line no-await-in-loop
                await bundle_1.default.run();
                this.log();
                this.log(chalk_1.default.underline.blue('Starting Server on port ' + flags.port));
                server.start();
                this.log();
                this.log(chalk_1.default `For a list of commands do {green h} or {green help}`);
            }
        }
        // eslint-disable-next-line no-process-exit, unicorn/no-process-exit
        process.exit(0);
    }
}
exports.default = Serve;
Serve.description = 'Build the sources and start a local server';
Serve.flags = {
    help: command_1.flags.help({ char: 'h' }),
    port: command_1.flags.integer({ char: 'p', default: 8080 }),
};
'\b\u00127';
