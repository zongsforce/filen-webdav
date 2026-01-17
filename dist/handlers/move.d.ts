import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Move
 *
 * @export
 * @class Move
 * @typedef {Move}
 */
export declare class Move {
    private readonly server;
    /**
     * Creates an instance of Move.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Move a file or a directory to the destination chosen in the header.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Move;
