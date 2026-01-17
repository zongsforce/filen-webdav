"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.WebDAVError = void 0;
/**
 * WebDAVError
 *
 * @export
 * @class WebDAVError
 * @typedef {WebDAVError}
 * @extends {Error}
 */
class WebDAVError extends Error {
    /**
     * Creates an instance of WebDAVError.
     *
     * @constructor
     * @public
     * @param {number} code
     * @param {string} message
     */
    constructor(code, message) {
        super(message);
        this.name = "WebDAVError";
        this.code = code;
        this.errno = code;
    }
}
exports.WebDAVError = WebDAVError;
/**
 * Error handling middleware.
 *
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @returns {void}
 */
const Errors = (err, req, res) => {
    if (res.headersSent) {
        return;
    }
    res.status(err instanceof WebDAVError ? err.code : 500);
    res.set("Content-Length", "0");
    res.end("Internal server error");
};
exports.Errors = Errors;
exports.default = exports.Errors;
//# sourceMappingURL=errors.js.map