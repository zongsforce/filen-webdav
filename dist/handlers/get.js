"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Get = void 0;
const mime_types_1 = __importDefault(require("mime-types"));
const stream_1 = require("stream");
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
/**
 * Get
 *
 * @export
 * @class Get
 * @typedef {Get}
 */
class Get {
    /**
     * Creates an instance of Get.
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
     * Download the requested file as a readStream.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(req, res) {
        try {
            const resource = await this.server.urlToResource(req);
            if (!resource || resource.type === "directory") {
                await responses_1.default.notFound(res, req.url);
                return;
            }
            if (resource.isVirtual) {
                res.status(200);
                res.set("Content-Type", resource.mime);
                res.set("Content-Length", "0");
                stream_1.Readable.from([]).pipe(res);
                return;
            }
            const sdk = this.server.getSDKForUser(req.username);
            if (!sdk) {
                await responses_1.default.notAuthorized(res);
                return;
            }
            const mimeType = mime_types_1.default.lookup(resource.name) || "application/octet-stream";
            const totalLength = resource.size;
            const range = req.headers.range || req.headers["content-range"];
            let start = 0;
            let end = totalLength - 1;
            if (range) {
                const parsedRange = (0, utils_1.parseByteRange)(range, totalLength);
                if (!parsedRange) {
                    await responses_1.default.badRequest(res);
                    return;
                }
                start = parsedRange.start;
                end = parsedRange.end;
                res.status(206);
                res.set("Content-Range", `bytes ${start}-${end}/${totalLength}`);
                res.set("Content-Length", (end - start + 1).toString());
            }
            else {
                res.status(200);
                res.set("Content-Length", resource.size.toString());
            }
            res.set("Content-Type", mimeType);
            res.set("Accept-Ranges", "bytes");
            if (resource.tempDiskId) {
                await pipelineAsync(fs_extra_1.default.createReadStream(path_1.default.join(this.server.tempDiskPath, resource.tempDiskId), {
                    autoClose: true,
                    flags: "r",
                    start,
                    end
                }), res);
            }
            else {
                const stream = sdk.cloud().downloadFileToReadableStream({
                    uuid: resource.uuid,
                    bucket: resource.bucket,
                    region: resource.region,
                    version: resource.version,
                    key: resource.key,
                    size: resource.size,
                    chunks: resource.chunks,
                    start,
                    end
                });
                const nodeStream = stream_1.Readable.fromWeb(stream);
                const cleanup = () => {
                    try {
                        stream.cancel().catch(() => { });
                        if (!nodeStream.closed && !nodeStream.destroyed) {
                            nodeStream.destroy();
                        }
                    }
                    catch (_a) {
                        // Noop
                    }
                };
                res.once("close", () => {
                    cleanup();
                });
                res.once("error", () => {
                    cleanup();
                });
                res.once("finish", () => {
                    cleanup();
                });
                req.once("close", () => {
                    cleanup();
                });
                req.once("error", () => {
                    cleanup();
                });
                nodeStream.once("error", () => {
                    cleanup();
                });
                nodeStream.pipe(res);
            }
        }
        catch (e) {
            this.server.logger.log("error", e, "get");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Get = Get;
exports.default = Get;
//# sourceMappingURL=get.js.map