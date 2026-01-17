import { type Express, type Request } from "express";
import FilenSDK, { type FSStats, type FilenSDKConfig } from "@filen/sdk";
import { type ISemaphore } from "./semaphore";
import https from "https";
import NodeCache from "node-cache";
import http, { type IncomingMessage, type ServerResponse } from "http";
import { type Socket } from "net";
import { type Duplex } from "stream";
import Logger from "./logger";
import { type Matcher } from "picomatch";
export type ServerConfig = {
    hostname: string;
    port: number;
};
export type Resource = FSStats & {
    url: string;
    path: string;
    isVirtual: boolean;
    tempDiskId?: string;
};
export type User = {
    sdkConfig?: FilenSDKConfig;
    sdk?: FilenSDK;
    username: string;
    password: string;
};
export type AuthMode = "basic" | "digest";
export type RateLimit = {
    windowMs: number;
    limit: number;
    key: "ip" | "username";
};
/**
 * WebDAVServer
 *
 * @export
 * @class WebDAVServer
 * @typedef {WebDAVServer}
 */
export declare class WebDAVServer {
    readonly server: Express;
    readonly users: Record<string, User>;
    readonly serverConfig: ServerConfig;
    readonly virtualFiles: Record<string, Record<string, Resource>>;
    readonly tempDiskFiles: Record<string, Record<string, Resource>>;
    readonly proxyMode: boolean;
    readonly defaultUsername: string;
    readonly defaultPassword: string;
    readonly authMode: AuthMode;
    readonly rwMutex: Record<string, Record<string, ISemaphore>>;
    readonly enableHTTPS: boolean;
    readonly cache: Record<string, NodeCache>;
    serverInstance: https.Server<typeof IncomingMessage, typeof ServerResponse> | http.Server<typeof IncomingMessage, typeof ServerResponse> | null;
    connections: Record<string, Socket | Duplex>;
    readonly rateLimit: RateLimit;
    readonly logger: Logger;
    readonly tempDiskPath: string;
    readonly putMatcher: Matcher | null;
    /**
     * Creates an instance of WebDAVServer.
     *
     * @constructor
     * @public
     * @param {{
     * 		hostname?: string
     * 		port?: number
     * 		authMode?: "basic" | "digest"
     * 		https?: boolean
     * 		user?: User
     * 		rateLimit?: RateLimit
     * 		disableLogging?: boolean
     * 		tempFilesToStoreOnDisk?: string[]
     * 	}} param0
     * @param {string} [param0.hostname="127.0.0.1"]
     * @param {number} [param0.port=1900]
     * @param {User} param0.user
     * @param {("basic" | "digest")} [param0.authMode="basic"]
     * @param {boolean} [param0.https=false]
     * @param {RateLimit} [param0.rateLimit={
     * 			windowMs: 1000,
     * 			limit: 1000,
     * 			key: "username"
     * 		}]
     * @param {boolean} [param0.disableLogging=false]
     * @param {{}} [param0.tempFilesToStoreOnDisk=[]] Glob patterns of files that should not be uploaded to the cloud. Files matching the pattern will be served locally.
     */
    constructor({ hostname, port, user, authMode, https, rateLimit, disableLogging, tempFilesToStoreOnDisk }: {
        hostname?: string;
        port?: number;
        authMode?: "basic" | "digest";
        https?: boolean;
        user?: User;
        rateLimit?: RateLimit;
        disableLogging?: boolean;
        tempFilesToStoreOnDisk?: string[];
    });
    /**
     * Return all virtual file handles for the passed username.
     *
     * @public
     * @param {?(string)} [username]
     * @returns {Record<string, Resource>}
     */
    getVirtualFilesForUser(username?: string): Record<string, Resource>;
    /**
     * Return all temp disk file handles for the passed username.
     *
     * @public
     * @param {?string} [username]
     * @returns {Record<string, Resource>}
     */
    getTempDiskFilesForUser(username?: string): Record<string, Resource>;
    /**
     * Return the FilenSDK instance for the passed username.
     *
     * @public
     * @param {?(string)} [username]
     * @returns {(FilenSDK | null)}
     */
    getSDKForUser(username?: string): FilenSDK | null;
    /**
     * Returns a NodeCache instance for each user.
     *
     * @public
     * @param {?string} [username]
     * @returns {NodeCache}
     */
    getCacheForUser(username?: string): NodeCache;
    /**
     * Get the RW mutex for the given username and path.
     *
     * @public
     * @param {string} path
     * @param {?string} [username]
     * @returns {ISemaphore}
     */
    getRWMutexForUser(path: string, username?: string): ISemaphore;
    /**
     * Get the WebDAV resource of the requested URL.
     *
     * @public
     * @async
     * @param {Request} req
     * @returns {Promise<Resource | null>}
     */
    urlToResource(req: Request): Promise<Resource | null>;
    /**
     * Convert a FilenSDK style path to a WebDAV resource.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {string} path
     * @returns {Promise<Resource | null>}
     */
    pathToResource(req: Request, path: string): Promise<Resource | null>;
    /**
     * Start the server.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stop the server.
     *
     * @public
     * @async
     * @param {boolean} [terminate=false]
     * @returns {Promise<void>}
     */
    stop(terminate?: boolean): Promise<void>;
}
/**
 * WebDAVServerCluster
 *
 * @export
 * @class WebDAVServerCluster
 * @typedef {WebDAVServerCluster}
 */
export declare class WebDAVServerCluster {
    private enableHTTPS;
    private authMode;
    private rateLimit;
    private serverConfig;
    private proxyMode;
    private user;
    private threads;
    private workers;
    private stopSpawning;
    private tempFilesToStoreOnDisk;
    /**
     * Creates an instance of WebDAVServerCluster.
     *
     * @constructor
     * @public
     * @param {{
     * 		hostname?: string
     * 		port?: number
     * 		authMode?: "basic" | "digest"
     * 		https?: boolean
     * 		user?: {
     * 			sdkConfig?: FilenSDKConfig
     * 			sdk?: FilenSDK
     * 			username: string
     * 			password: string
     * 		}
     * 		rateLimit?: RateLimit
     * 		disableLogging?: boolean
     * 		threads?: number
     * 		tempFilesToStoreOnDisk?: string[]
     * 	}} param0
     * @param {string} [param0.hostname="127.0.0.1"]
     * @param {number} [param0.port=1900]
     * @param {{ sdkConfig?: FilenSDKConfig; sdk?: FilenSDK; username: string; password: string; }} param0.user
     * @param {("basic" | "digest")} [param0.authMode="basic"]
     * @param {boolean} [param0.https=false]
     * @param {RateLimit} [param0.rateLimit={
     * 			windowMs: 1000,
     * 			limit: 1000,
     * 			key: "username"
     * 		}]
     * @param {number} param0.threads
     * @param {{}} [param0.tempFilesToStoreOnDisk=[]] Glob patterns of files that should not be uploaded to the cloud. Files matching the pattern will be served locally.
     */
    constructor({ hostname, port, user, authMode, https, rateLimit, threads, tempFilesToStoreOnDisk }: {
        hostname?: string;
        port?: number;
        authMode?: "basic" | "digest";
        https?: boolean;
        user?: {
            sdkConfig?: FilenSDKConfig;
            sdk?: FilenSDK;
            username: string;
            password: string;
        };
        rateLimit?: RateLimit;
        disableLogging?: boolean;
        threads?: number;
        tempFilesToStoreOnDisk?: string[];
    });
    /**
     * Spawn a worker.
     *
     * @private
     */
    private spawnWorker;
    /**
     * Fork all needed threads.
     *
     * @private
     * @async
     * @returns {Promise<"master" | "worker">}
     */
    private startCluster;
    /**
     * Start the WebDAV cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stop the WebDAV cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    stop(): Promise<void>;
}
export default WebDAVServer;
