import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Delete
 *
 * @export
 * @class Delete
 * @typedef {Delete}
 */
export declare class Delete {
    private readonly server;
    /**
     * Creates an instance of Delete.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Delete a file or a directory.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Delete;
