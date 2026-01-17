import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Mkcol
 *
 * @export
 * @class Mkcol
 * @typedef {Mkcol}
 */
export declare class Mkcol {
    private readonly server;
    /**
     * Creates an instance of Mkcol.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Create a directory at the requested URL.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Mkcol;
