import { type Request, type Response, type NextFunction } from "express";
import type Server from "..";
export declare const REALM = "Default realm";
export declare const BASIC_AUTH_HEADER = "Basic realm=\"Default realm\", charset=\"UTF-8\"";
export declare function parseDigestAuthHeader(header: string): Record<string, string>;
/**
 * Auth
 *
 * @export
 * @class Auth
 * @typedef {Auth}
 */
export declare class Auth {
    private readonly server;
    readonly authedFilenUsers: Record<string, string>;
    private readonly mutex;
    /**
     * Creates an instance of Auth.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server: Server);
    /**
     * Generate a random 16 byte hex string used as a nonce or opaque.
     *
     * @public
     * @returns {string}
     */
    generateNonce(): string;
    /**
     * Returns the appropriate auth header based on the chosen auth mode.
     *
     * @public
     * @returns {string}
     */
    authHeader(): string;
    /**
     * Filen based authentication. Only used in proxy mode.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {string} username
     * @param {string} password
     * @returns {Promise<void>}
     */
    filenAuth(req: Request, username: string, password: string): Promise<void>;
    /**
     * Default auth based on predefined username/password.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {string} username
     * @param {string} password
     * @returns {Promise<void>}
     */
    defaultAuth(req: Request, username: string, password: string): Promise<void>;
    /**
     * Basic auth handling. Switches to Filen auth when it parses valid username/password combination and the server is set to proxy mode.
     *
     * @public
     * @async
     * @param {Request} req
     * @returns {Promise<void>}
     */
    basic(req: Request): Promise<void>;
    /**
     * Digest auth handling.
     *
     * @public
     * @async
     * @param {Request} req
     * @returns {Promise<void>}
     */
    digest(req: Request): Promise<void>;
    /**
     * Handle auth.
     *
     * @public
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    handle(req: Request, res: Response, next: NextFunction): void;
}
export default Auth;
