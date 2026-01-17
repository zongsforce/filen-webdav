import { type ErrorRequestHandler } from "express";
/**
 * WebDAVError
 *
 * @export
 * @class WebDAVError
 * @typedef {WebDAVError}
 * @extends {Error}
 */
export declare class WebDAVError extends Error {
    errno: number;
    code: number;
    /**
     * Creates an instance of WebDAVError.
     *
     * @constructor
     * @public
     * @param {number} code
     * @param {string} message
     */
    constructor(code: number, message: string);
}
/**
 * Error handling middleware.
 *
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @returns {void}
 */
export declare const Errors: ErrorRequestHandler;
export default Errors;
