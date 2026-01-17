import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Copy
 *
 * @export
 * @class Copy
 * @typedef {Copy}
 */
export declare class Copy {
    private readonly server;
    /**
     * Creates an instance of Copy.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Copy a resource to the destination defined in the destination header. Overwrite if needed.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Copy;
