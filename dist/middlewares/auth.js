"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = exports.BASIC_AUTH_HEADER = exports.REALM = void 0;
exports.parseDigestAuthHeader = parseDigestAuthHeader;
const sdk_1 = __importDefault(require("@filen/sdk"));
const semaphore_1 = require("../semaphore");
const crypto_1 = __importDefault(require("crypto"));
exports.REALM = "Default realm";
exports.BASIC_AUTH_HEADER = `Basic realm="${exports.REALM}", charset="UTF-8"`;
function parseDigestAuthHeader(header) {
    const params = {};
    header.split(",").forEach(param => {
        let [key, value] = param.split("=");
        if (key && value) {
            key = key.split(" ").join("");
            value = value.split(" ").join("");
            // eslint-disable-next-line quotes
            params[key] = value.split('"').join("");
        }
    });
    return params;
}
/**
 * Auth
 *
 * @export
 * @class Auth
 * @typedef {Auth}
 */
class Auth {
    /**
     * Creates an instance of Auth.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server) {
        this.server = server;
        this.authedFilenUsers = {};
        this.mutex = {};
        this.handle = this.handle.bind(this);
    }
    /**
     * Generate a random 16 byte hex string used as a nonce or opaque.
     *
     * @public
     * @returns {string}
     */
    generateNonce() {
        return crypto_1.default.randomBytes(16).toString("hex");
    }
    /**
     * Returns the appropriate auth header based on the chosen auth mode.
     *
     * @public
     * @returns {string}
     */
    authHeader() {
        if (this.server.authMode === "digest") {
            return `Digest realm="${exports.REALM}", qop="auth", nonce="${this.generateNonce()}", opaque="${this.generateNonce()}"`;
        }
        return `Basic realm="${exports.REALM}", charset="UTF-8"`;
    }
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
    async filenAuth(req, username, password) {
        if (!this.mutex[username]) {
            this.mutex[username] = new semaphore_1.Semaphore(1);
        }
        await this.mutex[username].acquire();
        try {
            if (this.authedFilenUsers[username] && this.authedFilenUsers[username] === password) {
                req.username = username;
                return;
            }
            let parsedPassword = null;
            let parsedTwoFactorCode = undefined;
            if (!password.startsWith("password=")) {
                parsedPassword = password;
            }
            else {
                const passwordEx = password.split("&twoFactorAuthentication=");
                if (!passwordEx[0] || !passwordEx[0].startsWith("password=")) {
                    throw new Error("Credentials wrongly formatted.");
                }
                parsedPassword = passwordEx[0].slice("password=".length);
                if (passwordEx.length >= 2) {
                    const twoFactor = passwordEx[1];
                    if (twoFactor && twoFactor.length >= 6) {
                        parsedTwoFactorCode = twoFactor;
                    }
                }
            }
            if (!parsedPassword) {
                throw new Error("Could not parse password.");
            }
            this.server.users[username] = {
                sdk: new sdk_1.default({
                    connectToSocket: true,
                    metadataCache: true
                }),
                username,
                password: parsedPassword
            };
            const sdk = this.server.getSDKForUser(username);
            if (!sdk) {
                throw new Error("Could not find SDK for user.");
            }
            try {
                await sdk.login({
                    email: username,
                    password: parsedPassword,
                    twoFactorCode: parsedTwoFactorCode
                });
            }
            catch (e) {
                delete this.server.users[username];
                throw e;
            }
            sdk.socket.on("socketEvent", (event) => {
                if (event.type === "passwordChanged") {
                    delete this.server.users[username];
                    delete this.authedFilenUsers[username];
                    delete this.server.virtualFiles[username];
                    delete this.server.tempDiskFiles[username];
                }
            });
            this.authedFilenUsers[username] = password;
            req.username = username;
        }
        finally {
            this.mutex[username].release();
        }
    }
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
    async defaultAuth(req, username, password) {
        if (username === this.server.defaultUsername && password === this.server.defaultPassword) {
            req.username = this.server.defaultUsername;
            return;
        }
        throw new Error("Invalid credentials.");
    }
    /**
     * Basic auth handling. Switches to Filen auth when it parses valid username/password combination and the server is set to proxy mode.
     *
     * @public
     * @async
     * @param {Request} req
     * @returns {Promise<void>}
     */
    async basic(req) {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Basic ")) {
            throw new Error("No authorization header provided.");
        }
        const base64Credentials = authHeader.split(" ")[1];
        if (!base64Credentials) {
            throw new Error("Invalid authorization header provided.");
        }
        const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
        const [username, password] = credentials.split(":");
        if (!username || !password) {
            throw new Error("No credentials provided.");
        }
        if (username.includes("@") && password.startsWith("password=") && this.server.proxyMode) {
            await this.filenAuth(req, username, password);
            return;
        }
        await this.defaultAuth(req, username, password);
    }
    /**
     * Digest auth handling.
     *
     * @public
     * @async
     * @param {Request} req
     * @returns {Promise<void>}
     */
    async digest(req) {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Digest ")) {
            throw new Error("No authorization header provided.");
        }
        const authParams = parseDigestAuthHeader(authHeader.slice(7));
        const username = authParams.username;
        if (!username || !authParams.response) {
            throw new Error("Invalid header provided.");
        }
        const ha1 = crypto_1.default.createHash("md5").update(`${username}:${exports.REALM}:${this.server.defaultPassword}`).digest("hex");
        const ha2 = crypto_1.default.createHash("md5").update(`${req.method}:${authParams.uri}`).digest("hex");
        const response = crypto_1.default
            .createHash("md5")
            .update(`${ha1}:${authParams.nonce}:${authParams.nc}:${authParams.cnonce}:${authParams.qop}:${ha2}`)
            .digest("hex");
        if (response !== authParams.response) {
            throw new Error("Invalid credentials.");
        }
        req.username = this.server.defaultUsername;
    }
    /**
     * Handle auth.
     *
     * @public
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    handle(req, res, next) {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            res.set("WWW-Authenticate", this.authHeader());
            res.status(401).end("Unauthorized");
            return;
        }
        if (this.server.authMode === "digest") {
            this.digest(req)
                .then(() => {
                next();
            })
                .catch(err => {
                this.server.logger.log("error", err, "auth.digest");
                this.server.logger.log("error", err);
                res.set("WWW-Authenticate", this.authHeader());
                res.status(401).end("Unauthorized");
            });
        }
        else {
            this.basic(req)
                .then(() => {
                next();
            })
                .catch(err => {
                this.server.logger.log("error", err, "auth.basic");
                this.server.logger.log("error", err);
                res.set("WWW-Authenticate", this.authHeader());
                res.status(401).end("Unauthorized");
            });
        }
    }
}
exports.Auth = Auth;
exports.default = Auth;
//# sourceMappingURL=auth.js.map