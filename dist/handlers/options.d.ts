import { type Request, type Response } from "express";
import type Server from "..";
/**
 * Options
 *
 * @export
 * @class Options
 * @typedef {Options}
 */
export declare class Options {
    private readonly server;
    /**
     * Creates an instance of Options.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Options
     *
     * @public
     * @async
     * @param {Request} _
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(_: Request, res: Response): Promise<void>;
}
export default Options;
