"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.requireAuth = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const signToken = (userId) => jsonwebtoken_1.default.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
exports.signToken = signToken;
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
    try {
        if (!token)
            throw new Error('missing');
        res.locals.userId = String(jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET).sub);
        next();
    }
    catch {
        res.status(401).json({ error: 'Authentication required' });
    }
};
exports.requireAuth = requireAuth;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({ error: 'Validation failed', issues: err.flatten().fieldErrors });
        return;
    }
    if (err?.code === 11000) {
        res.status(409).json({ error: 'Already exists' });
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
};
exports.errorHandler = errorHandler;
