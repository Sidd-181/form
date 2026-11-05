"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const r = (0, express_1.Router)();
r.use(middleware_1.requireAuth);
const current = (res) => models_1.User.findById(res.locals.userId);
const pw = zod_1.z.string().min(1).max(128);
// Wrong-password answers use 403, not 401, so the client doesn't treat them as an expired session.
const wrongPassword = (res) => { res.status(403).json({ error: 'Current password is incorrect' }); };
r.patch('/', async (req, res) => {
    const b = zod_1.z.object({
        name: zod_1.z.string().trim().min(1).max(100), workspaceName: zod_1.z.string().trim().max(100),
        defaultAccent: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/),
        notifications: zod_1.z.object({ newResponse: zod_1.z.boolean(), weeklyDigest: zod_1.z.boolean() }).partial(),
    }).partial().parse(req.body);
    const u = await current(res);
    if (!u) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    if (b.name !== undefined)
        u.name = b.name;
    if (b.workspaceName !== undefined)
        u.workspaceName = b.workspaceName;
    if (b.defaultAccent !== undefined)
        u.defaultAccent = b.defaultAccent;
    if (b.notifications?.newResponse !== undefined)
        u.set('notifications.newResponse', b.notifications.newResponse);
    if (b.notifications?.weeklyDigest !== undefined)
        u.set('notifications.weeklyDigest', b.notifications.weeklyDigest);
    await u.save();
    res.json((0, models_1.publicUser)(u));
});
r.post('/email', async (req, res) => {
    const b = zod_1.z.object({ email: zod_1.z.string().trim().email().max(254), password: pw }).parse(req.body);
    const u = await current(res);
    if (!u) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    if (!(await bcryptjs_1.default.compare(b.password, u.passwordHash)))
        return wrongPassword(res);
    const email = b.email.toLowerCase();
    if (email !== u.email && (await models_1.User.exists({ email }))) {
        res.status(409).json({ error: 'That email is already in use' });
        return;
    }
    u.email = email;
    await u.save();
    res.json((0, models_1.publicUser)(u));
});
r.post('/password', async (req, res) => {
    const b = zod_1.z.object({ currentPassword: pw, newPassword: zod_1.z.string().min(8).max(128) }).parse(req.body);
    const u = await current(res);
    if (!u) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    if (!(await bcryptjs_1.default.compare(b.currentPassword, u.passwordHash)))
        return wrongPassword(res);
    u.passwordHash = await bcryptjs_1.default.hash(b.newPassword, 12);
    await u.save();
    res.status(204).end();
});
r.delete('/account', async (req, res) => {
    const b = zod_1.z.object({ password: pw }).parse(req.body);
    const u = await current(res);
    if (!u) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    if (!(await bcryptjs_1.default.compare(b.password, u.passwordHash)))
        return wrongPassword(res);
    const ids = (await models_1.Form.find({ owner: u._id }).select('_id')).map(f => f._id);
    await models_1.FormResponse.deleteMany({ form: { $in: ids } });
    await models_1.Form.deleteMany({ owner: u._id });
    await u.deleteOne();
    res.status(204).end();
});
exports.default = r;
