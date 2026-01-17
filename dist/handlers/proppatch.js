"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proppatch = void 0;
exports.extractSetProperties = extractSetProperties;
const responses_1 = __importDefault(require("../responses"));
const xml2js_1 = require("xml2js");
const utils_1 = require("../utils");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSetProperties(parsedXml) {
    var _a, _b;
    const properties = {};
    // Ensure the root and "d:set" structure exist, with case-insensitive handling for namespaces
    if (!parsedXml || !parsedXml["d:propertyupdate"]) {
        return properties;
    }
    const propertyUpdate = parsedXml["d:propertyupdate"];
    const setSection = propertyUpdate["d:set"] || propertyUpdate["D:set"];
    if (!setSection || (!setSection["d:prop"] && !setSection["D:prop"])) {
        return properties;
    }
    const propSection = setSection["d:prop"] || setSection["D:prop"];
    const propEntries = Array.isArray(propSection) ? propSection : [propSection];
    for (const prop of propEntries) {
        for (const key in prop) {
            // Skip non-property keys or metadata
            if (key.startsWith("_") || key === "$") {
                continue;
            }
            // Handle namespaces (e.g., "d:property1" becomes "property1")
            const cleanKey = key.split(":").pop() || key;
            // Extract value, considering multiple possible formats
            const value = typeof prop[key] === "string" ? prop[key] : ((_a = prop[key]) === null || _a === void 0 ? void 0 : _a._text) || ((_b = prop[key]) === null || _b === void 0 ? void 0 : _b._) || null;
            properties[cleanKey] = value;
        }
    }
    return properties;
}
/**
 * Proppatch
 *
 * @export
 * @class Proppatch
 * @typedef {Proppatch}
 */
class Proppatch {
    /**
     * Creates an instance of Proppatch.
     *
     * @constructor
     * @public
     * @param {Server} server
     */
    constructor(server) {
        this.server = server;
        this.handle = this.handle.bind(this);
    }
    /**
     * Handle property patching. Not implemented (needed) right now.
     *
     * @public
     * @async
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<void>}
     */
    async handle(req, res) {
        try {
            const path = (0, utils_1.removeLastSlash)(decodeURIComponent(req.url));
            const resource = await this.server.urlToResource(req);
            if (!resource) {
                await responses_1.default.notFound(res, req.url);
                return;
            }
            if (resource.type !== "file") {
                await responses_1.default.proppatch(res, req.url);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsed = await (0, xml2js_1.parseStringPromise)(req.body, {
                trim: true,
                normalize: true,
                normalizeTags: true,
                explicitArray: false
            });
            const properties = extractSetProperties(parsed);
            let lastModified;
            let creation;
            if (!lastModified &&
                properties["getlastmodified"] &&
                typeof properties["getlastmodified"] === "string" &&
                (0, utils_1.isValidDate)(properties["getlastmodified"])) {
                lastModified = new Date(properties["getlastmodified"]).getTime();
            }
            if (!lastModified &&
                properties["lastmodified"] &&
                typeof properties["lastmodified"] === "string" &&
                (0, utils_1.isValidDate)(properties["lastmodified"])) {
                lastModified = new Date(properties["lastmodified"]).getTime();
            }
            if (!creation &&
                properties["creationdate"] &&
                typeof properties["creationdate"] === "string" &&
                (0, utils_1.isValidDate)(properties["creationdate"])) {
                creation = new Date(properties["creationdate"]).getTime();
            }
            if (!creation &&
                properties["getcreationdate"] &&
                typeof properties["getcreationdate"] === "string" &&
                (0, utils_1.isValidDate)(properties["getcreationdate"])) {
                creation = new Date(properties["getcreationdate"]).getTime();
            }
            if (!lastModified && !creation) {
                await responses_1.default.proppatch(res, req.url, Object.keys(properties));
                return;
            }
            if (resource.isVirtual) {
                const current = this.server.getVirtualFilesForUser(req.username)[path];
                if (current && current.type === "file") {
                    this.server.getVirtualFilesForUser(req.username)[path] = Object.assign(Object.assign({}, current), { lastModified: lastModified ? lastModified : current.lastModified, creation: creation ? creation : current.creation });
                }
            }
            else if (resource.tempDiskId) {
                const current = this.server.getTempDiskFilesForUser(req.username)[path];
                if (current && current.type === "file") {
                    this.server.getTempDiskFilesForUser(req.username)[path] = Object.assign(Object.assign({}, current), { lastModified: lastModified ? lastModified : current.lastModified, creation: creation ? creation : current.creation });
                }
            }
            else {
                const sdk = this.server.getSDKForUser(req.username);
                if (!sdk) {
                    await responses_1.default.notAuthorized(res);
                    return;
                }
                await sdk.cloud().editFileMetadata({
                    uuid: resource.uuid,
                    metadata: {
                        name: resource.name,
                        key: resource.key,
                        lastModified: lastModified ? lastModified : resource.lastModified,
                        creation: creation ? creation : resource.creation,
                        hash: resource.hash,
                        size: resource.size,
                        mime: resource.mime
                    }
                });
                await sdk.fs()._removeItem({ path });
                await sdk.fs()._addItem({
                    path,
                    item: {
                        type: "file",
                        uuid: resource.uuid,
                        metadata: {
                            name: resource.name,
                            size: resource.size,
                            lastModified: lastModified ? lastModified : resource.lastModified,
                            creation: creation ? creation : resource.creation,
                            hash: resource.hash,
                            key: resource.key,
                            bucket: resource.bucket,
                            region: resource.region,
                            version: resource.version,
                            chunks: resource.chunks,
                            mime: resource.mime
                        }
                    }
                });
            }
            await responses_1.default.proppatch(res, req.url, Object.keys(properties));
        }
        catch (e) {
            this.server.logger.log("error", e, "proppatch");
            this.server.logger.log("error", e);
            responses_1.default.internalError(res).catch(() => { });
        }
    }
}
exports.Proppatch = Proppatch;
exports.default = Proppatch;
//# sourceMappingURL=proppatch.js.map