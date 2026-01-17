import { type Request, type Response } from "express";
import type Server from "..";
export declare function extractSetProperties(parsedXml: any): {
    [key: string]: string | null;
};
/**
 * Proppatch
 *
 * @export
 * @class Proppatch
 * @typedef {Proppatch}
 */
export declare class Proppatch {
    private readonly server;
    /**
     * Creates an instance of Proppatch.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Handle property patching. Not implemented (needed) right now.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Proppatch;
