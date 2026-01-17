"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delete = void 0;
const responses_1 = __importDefault(require("../responses"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Delete
 *
 * @export
 * @class Delete
 * @typedef {Delete}
 */
class Delete {
    /**
     * Creates an instance of Delete.
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
     * Delete a file or a directory.
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
            if (resource.isVirtual) {
                delete this.server.getVirtualFilesForUser(req.username)[resource.path];
                await responses_1.default.ok(res);
                return;
            }
            if (resource.tempDiskId) {
                await fs_extra_1.default.rm(path_1.default.join(this.server.tempDiskPath, resource.tempDiskId), {
                    force: true,
                    maxRetries: 60 * 10,
                    recursive: true,
                    retryDelay: 100
                });
                delete this.server.getTempDiskFilesForUser(req.username)[resource.path];
                await responses_1.default.ok(res);
                return;
            }
            const sdk = this.server.getSDKForUser(req.username);
            if (!sdk) {
                await responses_1.default.notAuthorized(res);
                return;
            }
            await sdk.fs().unlink({
                path: resource.path,
                permanent: false
            });
            await responses_1.default.ok(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "delete");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Delete = Delete;
exports.default = Delete;
//# sourceMappingURL=delete.js.map