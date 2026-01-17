"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Put = exports.SizeCounter = void 0;
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const mime_types_1 = __importDefault(require("mime-types"));
const utils_1 = require("../utils");
const responses_1 = __importDefault(require("../responses"));
const stream_1 = require("stream");
const util_1 = require("util");
const fs_extra_1 = __importDefault(require("fs-extra"));
const sdk_1 = require("@filen/sdk");
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
class SizeCounter extends stream_1.Transform {
    constructor() {
        super();
        this.totalBytes = 0;
    }
    size() {
        return this.totalBytes;
    }
    _transform(chunk, _, callback) {
        this.totalBytes += chunk.length;
        this.push(chunk);
        callback();
    }
    _flush(callback) {
        callback();
    }
}
exports.SizeCounter = SizeCounter;
/**
 * Put
 *
 * @export
 * @class Put
 * @typedef {Put}
 */
class Put {
    /**
     * Creates an instance of Put.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    /**
     * Upload a file to the requested URL. If the incoming stream contains no data, we create a virtual file instead (Windows likes this).
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(req, res) {
        try {
            const path = (0, utils_1.removeLastSlash)(decodeURIComponent(req.url));
            const parentPath = path_1.default.posix.dirname(path);
            const name = path_1.default.posix.basename(path);
            const thisResource = await this.server.pathToResource(req, path);
            // The SDK handles checking if a file with the same name and parent already exists
            if (thisResource && thisResource.type === "directory") {
                await responses_1.default.alreadyExists(res);
                return;
            }
            const sdk = this.server.getSDKForUser(req.username);
            if (!sdk) {
                await responses_1.default.notAuthorized(res);
                return;
            }
            await sdk.fs().mkdir({ path: parentPath });
            const parentResource = await this.server.pathToResource(req, parentPath);
            if (!parentResource || parentResource.type !== "directory") {
                await responses_1.default.preconditionFailed(res);
                return;
            }
            if (!req.firstBodyChunk || req.firstBodyChunk.byteLength === 0) {
                this.server.getVirtualFilesForUser(req.username)[path] = {
                    type: "file",
                    uuid: (0, uuid_1.v4)(),
                    path: path,
                    url: path,
                    isDirectory() {
                        return false;
                    },
                    isFile() {
                        return true;
                    },
                    mtimeMs: Date.now(),
                    region: "",
                    bucket: "",
                    birthtimeMs: Date.now(),
                    key: "",
                    lastModified: Date.now(),
                    name,
                    mime: mime_types_1.default.lookup(name) || "application/octet-stream",
                    version: 2,
                    chunks: 1,
                    size: 0,
                    isVirtual: true
                };
                await responses_1.default.created(res);
                delete this.server.getTempDiskFilesForUser(req.username)[path];
                return;
            }
            let didError = false;
            const stream = new stream_1.PassThrough();
            await new Promise((resolve, reject) => {
                stream.write(req.firstBodyChunk, err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
            stream.on("error", () => {
                delete this.server.getVirtualFilesForUser(req.username)[path];
                delete this.server.getTempDiskFilesForUser(req.username)[path];
                didError = true;
                responses_1.default.internalError(res).catch(() => { });
            });
            if (this.server.putMatcher && (this.server.putMatcher(path) || this.server.putMatcher(name))) {
                const destinationTempDiskFileId = (0, utils_1.pathToTempDiskFileId)(path, req.username);
                await fs_extra_1.default.rm(path_1.default.join(this.server.tempDiskPath, destinationTempDiskFileId), {
                    force: true,
                    maxRetries: 60 * 10,
                    recursive: true,
                    retryDelay: 100
                });
                const sizeCounter = new SizeCounter();
                await pipelineAsync(req.pipe(stream), sizeCounter, fs_extra_1.default.createWriteStream(path_1.default.join(this.server.tempDiskPath, destinationTempDiskFileId), {
                    flags: "w",
                    autoClose: true
                }));
                this.server.getTempDiskFilesForUser(req.username)[path] = {
                    type: "file",
                    uuid: (0, uuid_1.v4)(),
                    path: path,
                    url: path,
                    isDirectory() {
                        return false;
                    },
                    isFile() {
                        return true;
                    },
                    mtimeMs: Date.now(),
                    region: "",
                    bucket: "",
                    birthtimeMs: Date.now(),
                    key: "",
                    lastModified: Date.now(),
                    name,
                    mime: mime_types_1.default.lookup(name) || "application/octet-stream",
                    version: 2,
                    chunks: Math.ceil(sizeCounter.size() / sdk_1.UPLOAD_CHUNK_SIZE),
                    size: sizeCounter.size(),
                    isVirtual: false,
                    tempDiskId: destinationTempDiskFileId
                };
                delete this.server.getVirtualFilesForUser(req.username)[path];
                await responses_1.default.created(res);
                return;
            }
            const item = await sdk.cloud().uploadLocalFileStream({
                source: req.pipe(stream),
                parent: parentResource.uuid,
                name,
                onError: () => {
                    delete this.server.getVirtualFilesForUser(req.username)[path];
                    delete this.server.getTempDiskFilesForUser(req.username)[path];
                    didError = true;
                    responses_1.default.internalError(res).catch(() => { });
                }
            });
            delete this.server.getVirtualFilesForUser(req.username)[path];
            delete this.server.getTempDiskFilesForUser(req.username)[path];
            if (didError) {
                return;
            }
            if (item.type !== "file") {
                await responses_1.default.badRequest(res);
                return;
            }
            await sdk.fs()._removeItem({ path });
            await sdk.fs()._addItem({
                path,
                item: {
                    type: "file",
                    uuid: item.uuid,
                    metadata: {
                        name,
                        size: item.size,
                        lastModified: item.lastModified,
                        creation: item.creation,
                        hash: item.hash,
                        key: item.key,
                        bucket: item.bucket,
                        region: item.region,
                        version: item.version,
                        chunks: item.chunks,
                        mime: item.mime
                    }
                }
            });
            await responses_1.default.created(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "put");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Put = Put;
exports.default = Put;
//# sourceMappingURL=put.js.map