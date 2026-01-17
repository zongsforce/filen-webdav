"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Propfind = void 0;
const responses_1 = __importDefault(require("../responses"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
/**
 * Propfind
 *
 * @export
 * @class Propfind
 * @typedef {Propfind}
 */
class Propfind {
    /**
     * Creates an instance of Propfind.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    async statfs(req, sdk) {
        const cache = this.server.getCacheForUser(req.username);
        const get = cache.get("statfs");
        if (get) {
            return get;
        }
        const stat = await sdk.fs().statfs();
        cache.set("statfs", stat, 60);
        return stat;
    }
    /**
     * List a file or a directory and it's children.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(req, res) {
        var _a;
        try {
            const depth = (_a = req.header("depth")) !== null && _a !== void 0 ? _a : "1";
            const resource = await this.server.urlToResource(req);
            if (!resource) {
                await responses_1.default.notFound(res, req.url);
                return;
            }
            const sdk = this.server.getSDKForUser(req.username);
            if (!sdk) {
                await responses_1.default.notAuthorized(res);
                return;
            }
            const statfs = await this.statfs(req, sdk);
            if (resource.type === "directory" && depth !== "0") {
                const content = await sdk.fs().readdir({ path: resource.url });
                const contentIncludingStats = await (0, utils_1.promiseAllChunked)(content.map(item => sdk.fs().stat({ path: path_1.default.posix.join(resource.url, item) })));
                for (const path in this.server.getVirtualFilesForUser(req.username)) {
                    const parentPath = path_1.default.dirname(path);
                    if (parentPath === resource.path || parentPath === resource.url) {
                        contentIncludingStats.push(this.server.getVirtualFilesForUser(req.username)[path]);
                    }
                }
                for (const path in this.server.getTempDiskFilesForUser(req.username)) {
                    const parentPath = path_1.default.dirname(path);
                    if (parentPath === resource.path || parentPath === resource.url) {
                        contentIncludingStats.push(this.server.getTempDiskFilesForUser(req.username)[path]);
                    }
                }
                await responses_1.default.propfind(res, [
                    resource,
                    ...contentIncludingStats.map(item => (Object.assign(Object.assign({}, item), { path: path_1.default.posix.join(resource.path, item.name), url: `${path_1.default.posix.join(resource.path, item.name)}${item.type === "directory" ? "/" : ""}`, isVirtual: false })))
                ], {
                    available: (statfs.max - statfs.used) * 1,
                    used: statfs.used * 1
                });
                return;
            }
            await responses_1.default.propfind(res, [
                Object.assign(Object.assign({}, resource), { url: `${resource.url}${resource.type === "directory" && !resource.url.endsWith("/") ? "/" : ""}` })
            ], {
                available: (statfs.max - statfs.used) * 1,
                used: statfs.used * 1
            });
        }
        catch (e) {
            this.server.logger.log("error", e, "propfind");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Propfind = Propfind;
exports.default = Propfind;
//# sourceMappingURL=propfind.js.map