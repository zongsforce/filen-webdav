import { type Response } from "express";
import { Builder } from "xml2js";
import { type Resource } from ".";
/**
 * Responses
 *
 * @export
 * @class Responses
 * @typedef {Responses}
 */
export declare class Responses {
    static readonly xmlBuilder: Builder;
    static propfind(res: Response, resources: Resource[], quota: {
        used: number;
        available: number;
    }): Promise<void>;
    static proppatch(res: Response, url: string, propsSet?: string[]): Promise<void>;
    static notFound(res: Response, url: string): Promise<void>;
    static badRequest(res: Response): Promise<void>;
    static alreadyExists(res: Response): Promise<void>;
    static created(res: Response): Promise<void>;
    static ok(res: Response): Promise<void>;
    static noContent(res: Response): Promise<void>;
    static notImplemented(res: Response): Promise<void>;
    static forbidden(res: Response): Promise<void>;
    static internalError(res: Response): Promise<void>;
    static notAuthorized(res: Response): Promise<void>;
    static preconditionFailed(res: Response): Promise<void>;
}
export default Responses;
