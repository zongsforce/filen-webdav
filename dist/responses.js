"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Responses = void 0;
const xml2js_1 = require("xml2js");
const mime_types_1 = __importDefault(require("mime-types"));
/**
 * Responses
 *
 * @export
 * @class Responses
 * @typedef {Responses}
 */
class Responses {
    static async propfind(res, resources, quota) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            "D:multistatus": {
                $: {
                    "xmlns:D": "DAV:"
                },
                "D:response": resources.map(resource => {
                    const lastModified = new Date(resource.mtimeMs).toUTCString();
                    const creationDate = new Date(resource.birthtimeMs).toISOString();
                    return {
                        "D:href": `${resource.url
                            .split("/")
                            .map(part => encodeURIComponent(part))
                            .join("/")}`,
                        ["D:propstat"]: {
                            "D:prop": {
                                "D:getlastmodified": lastModified,
                                "D:lastmodified": lastModified,
                                "D:displayname": resource.name,
                                "D:getcontentlength": resource.type === "directory" ? 0 : resource.size,
                                "D:getetag": resource.uuid,
                                "D:creationdate": creationDate,
                                "D:getcreationdate": creationDate,
                                "D:quota-available-bytes": quota.available.toString(),
                                "D:quota-used-bytes": quota.used.toString(),
                                "D:getcontenttype": resource.type === "directory"
                                    ? "httpd/unix-directory"
                                    : mime_types_1.default.lookup(resource.name) || "application/octet-stream",
                                "D:resourcetype": resource.type === "directory"
                                    ? {
                                        "D:collection": ""
                                    }
                                    : {
                                        "D:file": ""
                                    }
                            },
                            "D:status": "HTTP/1.1 200 OK"
                        }
                    };
                })
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.from(response, "utf-8").byteLength.toString());
        res.status(207);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async proppatch(res, url, propsSet) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            "D:multistatus": {
                $: {
                    "xmlns:D": "DAV:"
                },
                "D:response": {
                    "D:href": `${url
                        .split("/")
                        .map(part => encodeURIComponent(part))
                        .join("/")}`,
                    ["D:propstat"]: {
                        "D:prop": propsSet
                            ? propsSet.reduce((prev, curr) => (Object.assign(Object.assign({}, prev), { [curr.startsWith("d:") ? curr.split("d:").join("D:") : `D:${curr}`]: {} })), {})
                            : {},
                        "D:status": "HTTP/1.1 207 Multi-Status"
                    }
                }
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.from(response, "utf-8").byteLength.toString());
        res.status(207);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async notFound(res, url) {
        if (res.headersSent) {
            return;
        }
        const response = this.xmlBuilder.buildObject({
            "D:multistatus": {
                $: {
                    "xmlns:D": "DAV:"
                },
                "D:response": {
                    "D:href": `${url
                        .split("/")
                        .map(part => encodeURIComponent(part))
                        .join("/")}`,
                    ["D:propstat"]: {
                        "D:prop": {},
                        "D:status": "HTTP/1.1 404 NOT FOUND"
                    }
                }
            }
        });
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Content-Length", Buffer.from(response, "utf-8").byteLength.toString());
        res.status(404);
        await new Promise(resolve => {
            res.end(response, () => {
                resolve();
            });
        });
    }
    static async badRequest(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(400);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async alreadyExists(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(403);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async created(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(201);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async ok(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(200);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async noContent(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(204);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async notImplemented(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(501);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async forbidden(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(403);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async internalError(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(500);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async notAuthorized(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(401);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
    static async preconditionFailed(res) {
        if (res.headersSent) {
            return;
        }
        res.set("Content-Length", "0");
        res.status(412);
        await new Promise(resolve => {
            res.end(() => {
                resolve();
            });
        });
    }
}
exports.Responses = Responses;
Responses.xmlBuilder = new xml2js_1.Builder({
    xmldec: {
        version: "1.0",
        encoding: "utf-8"
    }
});
exports.default = Responses;
//# sourceMappingURL=responses.js.map