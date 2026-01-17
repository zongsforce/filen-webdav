import { type Request, type Response } from "express";
import type Server from "..";
import { Transform } from "stream";
export declare class SizeCounter extends Transform {
    private totalBytes;
    constructor();
    size(): number;
    _transform(chunk: Buffer, _: BufferEncoding, callback: () => void): void;
    _flush(callback: () => void): void;
}
/**
 * Put
 *
 * @export
 * @class Put
 * @typedef {Put}
 */
export declare class Put {
    private readonly server;
    /**
     * Creates an instance of Put.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Upload a file to the requested URL. If the incoming stream contains no data, we create a virtual file instead (Windows likes this).
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    handle(req: Request, res: Response): Promise<void>;
}
export default Put;
