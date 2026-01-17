"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unlock = void 0;
const responses_1 = __importDefault(require("../responses"));
/**
 * Unlock
 *
 * @export
 * @class Unlock
 * @typedef {Unlock}
 */
class Unlock {
    /**
     * Creates an instance of Unlock.
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
     * Handle unlocking. Not implemented (needed) right now.
     *
     * @public
     * @async
     * @param {Request} _
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(_, res) {
        try {
            await responses_1.default.notImplemented(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "unlock");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Unlock = Unlock;
exports.default = Unlock;
//# sourceMappingURL=unlock.js.map