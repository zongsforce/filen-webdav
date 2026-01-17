"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = body;
const responses_1 = __importDefault(require("../responses"));
function body(req, res, next) {
    if (!["POST", "PUT"].includes(req.method)) {
        next();
        return;
    }
    req.once("readable", () => {
        try {
            const chunk = req.read(1);
            req.firstBodyChunk = chunk instanceof Buffer ? chunk : null;
            next();
        }
        catch (_a) {
            responses_1.default.internalError(res).catch(() => { });
        }
    });
}
//# sourceMappingURL=body.js.map