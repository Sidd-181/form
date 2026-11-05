"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTokenFilter = exports.hashResetToken = exports.createResetToken = exports.RESET_TOKEN_TTL_MS = void 0;
const node_crypto_1 = require("node:crypto");
exports.RESET_TOKEN_TTL_MS = 30 * 60_000;
const createResetToken = () => (0, node_crypto_1.randomBytes)(32).toString('base64url');
exports.createResetToken = createResetToken;
const hashResetToken = (token) => (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
exports.hashResetToken = hashResetToken;
const resetTokenFilter = (token, now = new Date()) => ({
    resetTokenHash: (0, exports.hashResetToken)(token),
    resetTokenExpiresAt: { $gt: now },
});
exports.resetTokenFilter = resetTokenFilter;
