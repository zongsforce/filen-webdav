import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Lock
 *
 * @export
 * @class Lock
 * @typedef {Lock}
 */
export declare class Lock {
    private readonly server;
    /**
     * Creates an instance of Lock.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Handle locking. Not implemented (needed) right now.
     *
     * @public
     * @async
     * @param {Request} _
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(_: Request, res: Response): Promise<void>;
}
export default Lock;
