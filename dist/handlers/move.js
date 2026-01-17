"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Move = void 0;
const responses_1 = __importDefault(require("../responses"));
const utils_1 = require("../utils");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Move
 *
 * @export
 * @class Move
 * @typedef {Move}
 */
class Move {
    /**
     * Creates an instance of Move.
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
     * Move a file or a directory to the destination chosen in the header.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(req, res) {
        try {
            const destinationHeader = req.headers["destination"];
            const overwrite = req.headers["overwrite"] === "T";
            if (typeof destinationHeader !== "string" ||
                !destinationHeader.includes(req.hostname) ||
                !destinationHeader.includes(req.protocol)) {
                await responses_1.default.badRequest(res);
                return;
            }
            let url;
            try {
                url = new URL(destinationHeader);
            }
            catch (_a) {
                await responses_1.default.badRequest(res);
                return;
            }
            if (!url) {
                await responses_1.default.badRequest(res);
                return;
            }
            const destination = decodeURIComponent(url.pathname);
            if (destination.startsWith("..") || destination.startsWith("./") || destination.startsWith("../")) {
                await responses_1.default.forbidden(res);
                return;
            }
            const [resource, destinationResource] = await Promise.all([
                this.server.urlToResource(req),
                this.server.pathToResource(req, (0, utils_1.removeLastSlash)(destination))
            ]);
            if (!resource) {
                await responses_1.default.notFound(res, req.url);
                return;
            }
            if (resource.path === destination) {
                await responses_1.default.created(res);
                return;
            }
            if (!overwrite && destinationResource) {
                await responses_1.default.alreadyExists(res);
                return;
            }
            const sdk = this.server.getSDKForUser(req.username);
            if (!sdk) {
                await responses_1.default.notAuthorized(res);
                return;
            }
            if (resource.isVirtual) {
                if (overwrite && destinationResource) {
                    if (destinationResource.tempDiskId) {
                        await fs_extra_1.default.rm(path_1.default.join(this.server.tempDiskPath, destinationResource.tempDiskId), {
                            force: true,
                            maxRetries: 60 * 10,
                            recursive: true,
                            retryDelay: 100
                        });
                    }
                    if (!destinationResource.isVirtual) {
                        await sdk.fs().unlink({
                            path: destinationResource.path,
                            permanent: true
                        });
                    }
                    this.server.getVirtualFilesForUser(req.username)[destination] = Object.assign(Object.assign({}, resource), { url: destination, path: destination, name: path_1.default.posix.basename(destination) });
                    delete this.server.getVirtualFilesForUser(req.username)[resource.path];
                    await responses_1.default.noContent(res);
                    return;
                }
                this.server.getVirtualFilesForUser(req.username)[destination] = Object.assign(Object.assign({}, resource), { url: destination, path: destination, name: path_1.default.posix.basename(destination) });
                delete this.server.getVirtualFilesForUser(req.username)[resource.path];
                await responses_1.default.created(res);
                return;
            }
            if (resource.tempDiskId) {
                const destinationTempDiskFileId = (0, utils_1.pathToTempDiskFileId)(destination, req.username);
                if (overwrite && destinationResource) {
                    if (destinationResource.tempDiskId) {
                        await fs_extra_1.default.rm(path_1.default.join(this.server.tempDiskPath, destinationResource.tempDiskId), {
                            force: true,
                            maxRetries: 60 * 10,
                            recursive: true,
                            retryDelay: 100
                        });
                    }
                    if (!destinationResource.isVirtual) {
                        await sdk.fs().unlink({
                            path: destinationResource.path,
                            permanent: true
                        });
                    }
                    await fs_extra_1.default.rename(path_1.default.join(this.server.tempDiskPath, resource.tempDiskId), path_1.default.join(this.server.tempDiskPath, destinationTempDiskFileId));
                    this.server.getTempDiskFilesForUser(req.username)[destination] = Object.assign(Object.assign({}, resource), { url: destination, path: destination, name: path_1.default.posix.basename(destination), tempDiskId: destinationTempDiskFileId });
                    delete this.server.getTempDiskFilesForUser(req.username)[resource.path];
                    await responses_1.default.noContent(res);
                    return;
                }
                await fs_extra_1.default.rename(path_1.default.join(this.server.tempDiskPath, resource.tempDiskId), path_1.default.join(this.server.tempDiskPath, destinationTempDiskFileId));
                this.server.getTempDiskFilesForUser(req.username)[destination] = Object.assign(Object.assign({}, resource), { url: destination, path: destination, name: path_1.default.posix.basename(destination), tempDiskId: destinationTempDiskFileId });
                delete this.server.getTempDiskFilesForUser(req.username)[resource.path];
                await responses_1.default.created(res);
                return;
            }
            if (overwrite && destinationResource) {
                await sdk.fs().unlink({
                    path: destinationResource.path,
                    permanent: false
                });
                await sdk.fs().rename({
                    from: resource.path,
                    to: destination
                });
                await responses_1.default.noContent(res);
                return;
            }
            await sdk.fs().rename({
                from: resource.path,
                to: destination
            });
            await responses_1.default.created(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "move");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Move = Move;
exports.default = Move;
//# sourceMappingURL=move.js.map