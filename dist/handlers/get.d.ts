import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Get
 *
 * @export
 * @class Get
 * @typedef {Get}
 */
export declare class Get {
    private readonly server;
    /**
     * Creates an instance of Get.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Download the requested file as a readStream.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Get;
