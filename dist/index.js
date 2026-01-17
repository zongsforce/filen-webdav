"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebDAVServerCluster = exports.WebDAVServer = void 0;
const express_1 = __importDefault(require("express"));
const head_1 = __importDefault(require("./handlers/head"));
const sdk_1 = __importDefault(require("@filen/sdk"));
const get_1 = __importDefault(require("./handlers/get"));
const errors_1 = __importDefault(require("./middlewares/errors"));
const body_parser_1 = __importDefault(require("body-parser"));
const options_1 = __importDefault(require("./handlers/options"));
const propfind_1 = __importDefault(require("./handlers/propfind"));
const put_1 = __importDefault(require("./handlers/put"));
const mkcol_1 = __importDefault(require("./handlers/mkcol"));
const delete_1 = __importDefault(require("./handlers/delete"));
const copy_1 = __importDefault(require("./handlers/copy"));
const proppatch_1 = __importDefault(require("./handlers/proppatch"));
const move_1 = __importDefault(require("./handlers/move"));
const auth_1 = __importStar(require("./middlewares/auth"));
const utils_1 = require("./utils");
const lock_1 = __importDefault(require("./handlers/lock"));
const unlock_1 = __importDefault(require("./handlers/unlock"));
const semaphore_1 = require("./semaphore");
const https_1 = __importDefault(require("https"));
const certs_1 = __importDefault(require("./certs"));
const body_1 = __importDefault(require("./middlewares/body"));
const node_cache_1 = __importDefault(require("node-cache"));
const http_1 = __importDefault(require("http"));
const uuid_1 = require("uuid");
const express_rate_limit_1 = require("express-rate-limit");
const logger_1 = __importDefault(require("./logger"));
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
// @ts-expect-error Picomatch exports wrong types
const posix_1 = __importDefault(require("picomatch/posix"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * WebDAVServer
 *
 * @export
 * @class WebDAVServer
 * @typedef {WebDAVServer}
 */
class WebDAVServer {
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
    constructor({ hostname = "127.0.0.1", port = 1900, user, authMode = "basic", https = false, rateLimit = {
        windowMs: 1000,
        limit: 1000,
        key: "username"
    }, disableLogging = false, tempFilesToStoreOnDisk = [] }) {
        this.users = {};
        this.virtualFiles = {};
        this.tempDiskFiles = {};
        this.defaultUsername = "";
        this.defaultPassword = "";
        this.rwMutex = {};
        this.cache = {};
        this.serverInstance = null;
        this.connections = {};
        this.enableHTTPS = https;
        this.authMode = authMode;
        this.rateLimit = rateLimit;
        this.serverConfig = {
            hostname,
            port
        };
        this.proxyMode = typeof user === "undefined";
        this.server = (0, express_1.default)();
        this.logger = new logger_1.default(disableLogging, false);
        this.tempDiskPath = (0, utils_1.tempDiskPath)();
        this.putMatcher = tempFilesToStoreOnDisk.length > 0 ? (0, posix_1.default)(tempFilesToStoreOnDisk) : null;
        if (this.proxyMode && this.authMode === "digest") {
            throw new Error("Digest authentication is not supported in proxy mode.");
        }
        if (user) {
            if (!user.sdk && !user.sdkConfig) {
                throw new Error("Either pass a configured SDK instance OR a SDKConfig object to the user object.");
            }
            this.defaultUsername = user.username;
            this.defaultPassword = user.password;
            this.users[user.username] = {
                username: user.username,
                password: user.password,
                sdk: user.sdk
                    ? user.sdk
                    : new sdk_1.default(Object.assign(Object.assign({}, user.sdkConfig), { connectToSocket: true, metadataCache: true }))
            };
            if (this.defaultUsername.length === 0 || this.defaultPassword.length === 0) {
                throw new Error("Username or password empty.");
            }
        }
    }
    /**
     * Return all virtual file handles for the passed username.
     *
     * @public
     * @param {?(string)} [username]
     * @returns {Record<string, Resource>}
     */
    getVirtualFilesForUser(username) {
        if (!username) {
            return {};
        }
        if (this.virtualFiles[username]) {
            return this.virtualFiles[username];
        }
        this.virtualFiles[username] = {};
        return this.virtualFiles[username];
    }
    /**
     * Return all temp disk file handles for the passed username.
     *
     * @public
     * @param {?string} [username]
     * @returns {Record<string, Resource>}
     */
    getTempDiskFilesForUser(username) {
        if (!username) {
            return {};
        }
        if (this.tempDiskFiles[username]) {
            return this.tempDiskFiles[username];
        }
        this.tempDiskFiles[username] = {};
        return this.tempDiskFiles[username];
    }
    /**
     * Return the FilenSDK instance for the passed username.
     *
     * @public
     * @param {?(string)} [username]
     * @returns {(FilenSDK | null)}
     */
    getSDKForUser(username) {
        if (!username) {
            return null;
        }
        if (this.users[username] && this.users[username].sdk) {
            return this.users[username].sdk;
        }
        return null;
    }
    /**
     * Returns a NodeCache instance for each user.
     *
     * @public
     * @param {?string} [username]
     * @returns {NodeCache}
     */
    getCacheForUser(username) {
        if (!username) {
            return new node_cache_1.default();
        }
        if (!this.cache[username]) {
            this.cache[username] = new node_cache_1.default();
        }
        return this.cache[username];
    }
    /**
     * Get the RW mutex for the given username and path.
     *
     * @public
     * @param {string} path
     * @param {?string} [username]
     * @returns {ISemaphore}
     */
    getRWMutexForUser(path, username) {
        path = (0, utils_1.removeLastSlash)(decodeURIComponent(path));
        if (!username) {
            return new semaphore_1.Semaphore(1);
        }
        if (!this.rwMutex[username]) {
            this.rwMutex[username] = {};
        }
        if (this.rwMutex[username][path]) {
            return this.rwMutex[username][path];
        }
        this.rwMutex[username][path] = new semaphore_1.Semaphore(1);
        return this.rwMutex[username][path];
    }
    /**
     * Get the WebDAV resource of the requested URL.
     *
     * @public
     * @async
     * @param {Request} req
     * @returns {Promise<Resource | null>}
     */
    async urlToResource(req) {
        const url = decodeURIComponent(req.url);
        const path = url === "/" ? url : (0, utils_1.removeLastSlash)(url);
        if (this.getVirtualFilesForUser(req.username)[path]) {
            return this.getVirtualFilesForUser(req.username)[path];
        }
        if (this.getTempDiskFilesForUser(req.username)[path]) {
            return this.getTempDiskFilesForUser(req.username)[path];
        }
        const sdk = this.getSDKForUser(req.username);
        if (!sdk) {
            return null;
        }
        try {
            const stat = await sdk.fs().stat({ path });
            return Object.assign(Object.assign({}, stat), { url: `${path}${stat.type === "directory" && stat.uuid !== sdk.config.baseFolderUUID ? "/" : ""}`, path, isVirtual: false });
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Convert a FilenSDK style path to a WebDAV resource.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {string} path
     * @returns {Promise<Resource | null>}
     */
    async pathToResource(req, path) {
        if (this.getVirtualFilesForUser(req.username)[path]) {
            return this.getVirtualFilesForUser(req.username)[path];
        }
        if (this.getTempDiskFilesForUser(req.username)[path]) {
            return this.getTempDiskFilesForUser(req.username)[path];
        }
        const sdk = this.getSDKForUser(req.username);
        if (!sdk) {
            return null;
        }
        try {
            const stat = await sdk.fs().stat({ path: path === "/" ? path : (0, utils_1.removeLastSlash)(path) });
            return Object.assign(Object.assign({}, stat), { url: `${path}${stat.type === "directory" && stat.uuid !== sdk.config.baseFolderUUID ? "/" : ""}`, path, isVirtual: false });
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Start the server.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async start() {
        this.connections = {};
        this.server.disable("x-powered-by");
        this.server.use((0, express_rate_limit_1.rateLimit)({
            windowMs: this.rateLimit.windowMs,
            limit: this.rateLimit.limit,
            standardHeaders: "draft-7",
            legacyHeaders: true,
            keyGenerator: req => {
                var _a, _b, _c, _d, _e, _f;
                if (this.rateLimit.key === "ip") {
                    return (_a = req.ip) !== null && _a !== void 0 ? _a : "ip";
                }
                if (this.authMode === "digest") {
                    const authHeader = req.headers["authorization"];
                    if (!authHeader || !authHeader.startsWith("Digest ")) {
                        return (_b = req.ip) !== null && _b !== void 0 ? _b : "ip";
                    }
                    const authParams = (0, auth_1.parseDigestAuthHeader)(authHeader.slice(7));
                    const username = authParams.username;
                    if (!username || !authParams.response) {
                        return (_c = req.ip) !== null && _c !== void 0 ? _c : "ip";
                    }
                    return username;
                }
                else {
                    const authHeader = req.headers["authorization"];
                    if (!authHeader || !authHeader.startsWith("Basic ")) {
                        return (_d = req.ip) !== null && _d !== void 0 ? _d : "ip";
                    }
                    const base64Credentials = authHeader.split(" ")[1];
                    if (!base64Credentials) {
                        return (_e = req.ip) !== null && _e !== void 0 ? _e : "ip";
                    }
                    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
                    const [username, password] = credentials.split(":");
                    if (!username || !password) {
                        return (_f = req.ip) !== null && _f !== void 0 ? _f : "ip";
                    }
                    return username;
                }
            }
        }));
        this.server.use(new auth_1.default(this).handle);
        this.server.use((_, res, next) => {
            res.set("Allow", "OPTIONS, GET, HEAD, PUT, DELETE, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK");
            res.set("DAV", "1, 2");
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Credentials", "true");
            res.set("Access-Control-Expose-Headers", "DAV, content-length, Allow");
            res.set("MS-Author-Via", "DAV");
            res.set("Server", "Filen WebDAV");
            res.set("Cache-Control", "no-cache");
            next();
        });
        this.server.use((req, res, next) => {
            const method = req.method.toUpperCase();
            if (method === "POST" || method === "PUT") {
                (0, body_1.default)(req, res, next);
                return;
            }
            body_parser_1.default.text({
                type: ["application/xml", "text/xml"]
            })(req, res, next);
        });
        this.server.head("*", new head_1.default(this).handle);
        this.server.get("*", new get_1.default(this).handle);
        this.server.options("*", new options_1.default(this).handle);
        this.server.propfind("*", new propfind_1.default(this).handle);
        this.server.put("*", new put_1.default(this).handle);
        this.server.post("*", new put_1.default(this).handle);
        this.server.mkcol("*", new mkcol_1.default(this).handle);
        this.server.delete("*", new delete_1.default(this).handle);
        this.server.copy("*", new copy_1.default(this).handle);
        this.server.lock("*", new lock_1.default(this).handle);
        this.server.unlock("*", new unlock_1.default(this).handle);
        this.server.proppatch("*", new proppatch_1.default(this).handle);
        this.server.move("*", new move_1.default(this).handle);
        this.server.use(errors_1.default);
        await fs_extra_1.default.emptyDir(this.tempDiskPath);
        await new Promise((resolve, reject) => {
            if (this.enableHTTPS) {
                certs_1.default.get()
                    .then(certs => {
                    this.serverInstance = https_1.default
                        .createServer({
                        cert: certs.cert,
                        key: certs.privateKey
                    }, this.server)
                        .listen(this.serverConfig.port, this.serverConfig.hostname, () => {
                        this.serverInstance.setTimeout(86400000 * 7);
                        this.serverInstance.timeout = 86400000 * 7;
                        this.serverInstance.keepAliveTimeout = 86400000 * 7;
                        this.serverInstance.headersTimeout = 86400000 * 7 * 2;
                        resolve();
                    })
                        .on("connection", socket => {
                        const socketId = (0, uuid_1.v4)();
                        this.connections[socketId] = socket;
                        socket.once("close", () => {
                            delete this.connections[socketId];
                        });
                    });
                })
                    .catch(reject);
            }
            else {
                this.serverInstance = http_1.default
                    .createServer(this.server)
                    .listen(this.serverConfig.port, this.serverConfig.hostname, () => {
                    this.serverInstance.setTimeout(86400000 * 7);
                    this.serverInstance.timeout = 86400000 * 7;
                    this.serverInstance.keepAliveTimeout = 86400000 * 7;
                    this.serverInstance.headersTimeout = 86400000 * 7 * 2;
                    resolve();
                })
                    .on("connection", socket => {
                    const socketId = (0, uuid_1.v4)();
                    this.connections[socketId] = socket;
                    socket.once("close", () => {
                        delete this.connections[socketId];
                    });
                });
            }
        });
    }
    /**
     * Stop the server.
     *
     * @public
     * @async
     * @param {boolean} [terminate=false]
     * @returns {Promise<void>}
     */
    async stop(terminate = false) {
        await new Promise((resolve, reject) => {
            var _a;
            if (!this.serverInstance) {
                resolve();
                return;
            }
            this.serverInstance.close(err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
            if (terminate) {
                for (const socketId in this.connections) {
                    try {
                        (_a = this.connections[socketId]) === null || _a === void 0 ? void 0 : _a.destroy();
                        delete this.connections[socketId];
                    }
                    catch (_b) {
                        // Noop
                    }
                }
            }
        });
    }
}
exports.WebDAVServer = WebDAVServer;
/**
 * WebDAVServerCluster
 *
 * @export
 * @class WebDAVServerCluster
 * @typedef {WebDAVServerCluster}
 */
class WebDAVServerCluster {
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
    constructor({ hostname = "127.0.0.1", port = 1900, user, authMode = "basic", https = false, rateLimit = {
        windowMs: 1000,
        limit: 1000,
        key: "username"
    }, threads, tempFilesToStoreOnDisk = [] }) {
        this.workers = {};
        this.stopSpawning = false;
        this.enableHTTPS = https;
        this.authMode = authMode;
        this.rateLimit = rateLimit;
        this.serverConfig = {
            hostname,
            port
        };
        this.proxyMode = typeof user === "undefined";
        this.threads = typeof threads === "number" ? threads : os_1.default.cpus().length;
        this.user = user;
        this.tempFilesToStoreOnDisk = tempFilesToStoreOnDisk;
        if (this.proxyMode && this.authMode === "digest") {
            throw new Error("Digest authentication is not supported in proxy mode.");
        }
        if (this.user) {
            if (!this.user.sdk && !this.user.sdkConfig) {
                throw new Error("Either pass a configured SDK instance OR a SDKConfig object to the user object.");
            }
            if (this.user.username.length === 0 || this.user.password.length === 0) {
                throw new Error("Username or password empty.");
            }
        }
    }
    /**
     * Spawn a worker.
     *
     * @private
     */
    spawnWorker() {
        if (this.stopSpawning) {
            return;
        }
        const worker = cluster_1.default.fork();
        this.workers[worker.id] = {
            worker,
            ready: false
        };
    }
    /**
     * Fork all needed threads.
     *
     * @private
     * @async
     * @returns {Promise<"master" | "worker">}
     */
    async startCluster() {
        if (cluster_1.default.isPrimary) {
            return await new Promise((resolve, reject) => {
                try {
                    let workersReady = 0;
                    for (let i = 0; i < this.threads; i++) {
                        this.spawnWorker();
                    }
                    cluster_1.default.on("exit", async (worker) => {
                        if (workersReady < this.threads) {
                            return;
                        }
                        workersReady--;
                        delete this.workers[worker.id];
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        try {
                            this.spawnWorker();
                        }
                        catch (_a) {
                            // Noop
                        }
                    });
                    const errorTimeout = setTimeout(() => {
                        reject(new Error("Could not spawn all workers."));
                    }, 15000);
                    cluster_1.default.on("message", (worker, message) => {
                        if (message === "ready" && this.workers[worker.id]) {
                            workersReady++;
                            this.workers[worker.id].ready = true;
                            if (workersReady >= this.threads) {
                                clearTimeout(errorTimeout);
                                resolve("master");
                            }
                        }
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        }
        const server = new WebDAVServer({
            hostname: this.serverConfig.hostname,
            port: this.serverConfig.port,
            authMode: this.authMode,
            disableLogging: true,
            user: this.user,
            rateLimit: this.rateLimit,
            https: this.enableHTTPS,
            tempFilesToStoreOnDisk: this.tempFilesToStoreOnDisk
        });
        await server.start();
        if (process.send) {
            process.send("ready");
        }
        return "worker";
    }
    /**
     * Start the WebDAV cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async start() {
        await new Promise((resolve, reject) => {
            this.startCluster()
                .then(type => {
                if (type === "master") {
                    resolve();
                }
            })
                .catch(reject);
        });
    }
    /**
     * Stop the WebDAV cluster.
     *
     * @public
     * @async
     * @returns {Promise<void>}
     */
    async stop() {
        cluster_1.default.removeAllListeners();
        this.stopSpawning = true;
        for (const id in this.workers) {
            this.workers[id].worker.destroy();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.workers = {};
        this.stopSpawning = false;
    }
}
exports.WebDAVServerCluster = WebDAVServerCluster;
exports.default = WebDAVServer;
//# sourceMappingURL=index.js.map