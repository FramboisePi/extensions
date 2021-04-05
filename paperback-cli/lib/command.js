"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const command_1 = require("@oclif/command");
const utils_1 = require("./utils");
class default_1 extends command_1.default {
    log(message = '') {
        utils_1.default.log(message);
    }
    time(label, format = undefined) {
        return utils_1.default.time(label, format);
    }
}
exports.default = default_1;
