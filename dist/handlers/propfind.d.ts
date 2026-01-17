import { type Request, type Response } from "express";
import type Server from "..";
import { type StatFS, type FilenSDK } from "@filen/sdk";
/**
 * Propfind
 *
 * @export
 * @class Propfind
 * @typedef {Propfind}
 */
export declare class Propfind {
    private readonly server;
    /**
     * Creates an instance of Propfind.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    statfs(req: Request, sdk: FilenSDK): Promise<StatFS>;
    /**
     * List a file or a directory and it's children.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Propfind;
