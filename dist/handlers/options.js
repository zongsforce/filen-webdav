"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = void 0;
const responses_1 = __importDefault(require("../responses"));
/**
 * Options
 *
 * @export
 * @class Options
 * @typedef {Options}
 */
class Options {
    /**
     * Creates an instance of Options.
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
     * Options
     *
     * @public
     * @async
     * @param {Request} _
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(_, res) {
        try {
            await responses_1.default.ok(res);
        }
        catch (e) {
            this.server.logger.log("error", e, "options");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Options = Options;
exports.default = Options;
//# sourceMappingURL=options.js.map