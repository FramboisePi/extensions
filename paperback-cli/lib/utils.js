"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const chalk_1 = require("chalk");
class Utils {
    static fixedWidth(number, width) {
        return (new Array(width).join('0') + number).substr(-width);
    }
    static prefixTime(message = '') {
        const date = new Date();
        const time = `${this.fixedWidth(date.getHours(), 2)}:${Utils.fixedWidth(date.getMinutes(), 2)}:${Utils.fixedWidth(date.getSeconds(), 2)}:${Utils.fixedWidth(date.getMilliseconds(), 4)}`;
        return chalk_1.default `[{gray ${time}}] ${message}`;
    }
    static log(message = '') {
        const cursorTo = process.stdout.cursorTo;
        if (cursorTo) {
            cursorTo(0);
        }
        process.stdout.write(this.prefixTime(message) + '\n');
    }
    static error(message = '') {
        this.log(chalk_1.default `{red ${message}}`);
    }
    static time(label, template = '$1') {
        const startTime = process.hrtime.bigint();
        return {
            end: () => {
                const hrend = process.hrtime.bigint() - startTime;
                // eslint-disable-next-line new-cap
                this.log(`${template.replace('$1', label)}: ${chalk_1.default.green((hrend / BigInt(1000000)) + 'ms')}`);
            },
        };
    }
    static deleteFolderRecursive(folderPath) {
        folderPath = folderPath.trim();
        if (folderPath.length === 0 || folderPath === '/')
            return;
        if (fs.existsSync(folderPath)) {
            fs.readdirSync(folderPath).forEach(file => {
                const curPath = path.join(folderPath, file);
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    this.deleteFolderRecursive(curPath);
                }
                else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(folderPath);
        }
    }
    static copyFolderRecursive(source, target) {
        source = source.trim();
        if (source.length === 0 || source === '/')
            return;
        target = target.trim();
        if (target.length === 0 || target === '/')
            return;
        if (!fs.existsSync(source))
            return;
        let files = [];
        // check if folder needs to be created or integrated
        const targetFolder = path.join(target, path.basename(source));
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }
        // copy
        if (fs.lstatSync(source).isDirectory()) {
            files = fs.readdirSync(source);
            files.forEach(file => {
                const curSource = path.join(source, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    this.copyFolderRecursive(curSource, targetFolder);
                }
                else {
                    fs.copyFileSync(curSource, path.join(targetFolder, file));
                }
            });
        }
    }
}
exports.default = Utils;
Utils.headingFormat = chalk_1.default `{bold {red #} $1}`;
