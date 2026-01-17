import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Unlock
 *
 * @export
 * @class Unlock
 * @typedef {Unlock}
 */
export declare class Unlock {
    private readonly server;
    /**
     * Creates an instance of Unlock.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Handle unlocking. Not implemented (needed) right now.
     *
     * @public
     * @async
     * @param {Request} _
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(_: Request, res: Response): Promise<void>;
}
export default Unlock;
