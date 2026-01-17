import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Head
 *
 * @export
 * @class Head
 * @typedef {Head}
 */
export declare class Head {
    private readonly server;
    /**
     * Creates an instance of Head.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Head a file.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Head;
