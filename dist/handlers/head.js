"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Head = void 0;
const mime_types_1 = __importDefault(require("mime-types"));
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
/**
 * Head
 *
 * @export
 * @class Head
 * @typedef {Head}
 */
class Head {
    /**
     * Creates an instance of Head.
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
     * Head a file.
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
            if (!resource) {
                await responses_1.default.notFound(res, req.url);
                return;
            }
            if (resource.type === "directory") {
                await responses_1.default.forbidden(res);
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
                    res.status(400).end();
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
            await new Promise(resolve => {
                res.end(() => {
                    resolve();
                });
            });
        }
        catch (e) {
            this.server.logger.log("error", e, "head");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Head = Head;
exports.default = Head;
//# sourceMappingURL=head.js.map