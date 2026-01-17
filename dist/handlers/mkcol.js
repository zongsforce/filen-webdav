"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mkcol = void 0;
const responses_1 = __importDefault(require("../responses"));
/**
 * Mkcol
 *
 * @export
 * @class Mkcol
 * @typedef {Mkcol}
 */
class Mkcol {
    /**
     * Creates an instance of Mkcol.
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
     * Create a directory at the requested URL.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(req, res) {
        try {
            const path = decodeURIComponent(req.url.endsWith("/") ? req.url.slice(0, req.url.length - 1) : req.url);
            const sdk = this.server.getSDKForUser(req.username);
            if (!sdk) {
                await responses_1.default.notAuthorized(res);
                return;
            }
            // The SDK handles checking if a directory with the same name and parent already exists
            await sdk.fs().mkdir({ path });
            const resource = await this.server.urlToResource(req);
            if (!resource || resource.type !== "directory") {
                await responses_1.default.notFound(res, req.url);
                return;
            }
            await responses_1.default.created(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "mkcol");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Mkcol = Mkcol;
exports.default = Mkcol;
//# sourceMappingURL=mkcol.js.map