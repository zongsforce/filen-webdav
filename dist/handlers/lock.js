"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lock = void 0;
const responses_1 = __importDefault(require("../responses"));
/**
 * Lock
 *
 * @export
 * @class Lock
 * @typedef {Lock}
 */
class Lock {
    /**
     * Creates an instance of Lock.
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
     * Handle locking. Not implemented (needed) right now.
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
            this.server.logger.log("error", e, "lock");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Lock = Lock;
exports.default = Lock;
//# sourceMappingURL=lock.js.map