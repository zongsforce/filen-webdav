"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseAllChunked = promiseAllChunked;
exports.removeLastSlash = removeLastSlash;
exports.parseByteRange = parseByteRange;
exports.platformConfigPath = platformConfigPath;
exports.tempDiskPath = tempDiskPath;
exports.sanitizeFileName = sanitizeFileName;
exports.fastStringHash = fastStringHash;
exports.pathToTempDiskFileId = pathToTempDiskFileId;
exports.isValidDate = isValidDate;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const js_xxhash_1 = require("js-xxhash");
/**
 * Chunk large Promise.all executions.
 * @date 2/14/2024 - 11:59:34 PM
 *
 * @export
 * @async
 * @template T
 * @param {Promise<T>[]} promises
 * @param {number} [chunkSize=10000]
 * @returns {Promise<T[]>}
 */
async function promiseAllChunked(promises, chunkSize = 10000) {
    const results = [];
    for (let i = 0; i < promises.length; i += chunkSize) {
        const chunkResults = await Promise.all(promises.slice(i, i + chunkSize));
        results.push(...chunkResults);
    }
    return results;
}
function removeLastSlash(str) {
    return str.endsWith("/") ? str.substring(0, str.length - 1) : str;
}
/**
 * Parse the requested byte range from the header.
 *
 * @export
 * @param {string} range
 * @param {number} totalLength
 * @returns {({ start: number; end: number } | null)}
 */
function parseByteRange(range, totalLength) {
    const [unit, rangeValue] = range.split("=");
    if (unit !== "bytes" || !rangeValue) {
        return null;
    }
    const [startStr, endStr] = rangeValue.split("-");
    if (!startStr) {
        return null;
    }
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : totalLength - 1;
    if (isNaN(start) || isNaN(end) || start < 0 || end >= totalLength || start > end) {
        return null;
    }
    return {
        start,
        end
    };
}
/**
 * Return the platforms config path.
 *
 * @export
 * @returns {string}
 */
function platformConfigPath() {
    // Ref: https://github.com/FilenCloudDienste/filen-cli/blob/main/src/util.ts
    let configPath = "";
    switch (process.platform) {
        case "win32":
            configPath = path_1.default.resolve(process.env.APPDATA);
            break;
        case "darwin":
            configPath = path_1.default.resolve(path_1.default.join(os_1.default.homedir(), "Library/Application Support/"));
            break;
        default:
            configPath = process.env.XDG_CONFIG_HOME
                ? path_1.default.resolve(process.env.XDG_CONFIG_HOME)
                : path_1.default.resolve(path_1.default.join(os_1.default.homedir(), ".config/"));
            break;
    }
    if (!configPath || configPath.length === 0) {
        throw new Error("Could not find homedir path.");
    }
    configPath = path_1.default.join(configPath, "@filen", "webdav");
    if (!fs_extra_1.default.existsSync(configPath)) {
        fs_extra_1.default.mkdirSync(configPath, {
            recursive: true
        });
    }
    return configPath;
}
function tempDiskPath() {
    const path = path_1.default.join(platformConfigPath(), "tempDiskFiles");
    if (!fs_extra_1.default.existsSync(path)) {
        fs_extra_1.default.mkdirSync(path, {
            recursive: true
        });
    }
    return path;
}
const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
// eslint-disable-next-line no-control-regex
const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
function sanitizeFileName(fileName) {
    const sanitized = fileName.replace(invalidChars, "").replace(/\.+$/, "").replace(/\s+/g, "_").slice(0, 255);
    if (reservedWindowsNames.test(sanitized)) {
        return "_" + sanitized;
    }
    return sanitized;
}
function fastStringHash(input) {
    return input.substring(0, 8) + (0, js_xxhash_1.xxHash32)(input, 0).toString(16) + input.substring(input.length - 8, input.length);
}
function pathToTempDiskFileId(path, username) {
    return sanitizeFileName(fastStringHash(username ? username + "_" + path : path));
}
function isValidDate(date) {
    try {
        const d = new Date(date);
        return d !== "Invalid Date";
    }
    catch (_a) {
        return false;
    }
}
//# sourceMappingURL=utils.js.map