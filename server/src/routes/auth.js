"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const zod_1 = require("zod");
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const resetTokens_1 = require("../resetTokens");
const r = (0, express_1.Router)();
const creds = zod_1.z.object({ email: zod_1.z.string().email().max(254), password: zod_1.z.string().min(8).max(128) });
const session = (u) => ({ token: (0, middleware_1.signToken)(String(u._id)), user: (0, models_1.publicUser)(u) });
const resetMessage = 'If an account with that email exists, a password reset link has been sent.';
r.post('/signup', async (req, res) => {
    const b = creds.extend({ name: zod_1.z.string().trim().min(1).max(100) }).parse(req.body);
    if (await models_1.User.exists({ email: b.email.toLowerCase() })) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
    }
    const user = await models_1.User.create({ name: b.name, email: b.email, passwordHash: await bcryptjs_1.default.hash(b.password, 12) });
    res.status(201).json(session(user));
});
r.post('/login', async (req, res) => {
    const b = creds.parse(req.body);
    const user = await models_1.User.findOne({ email: b.email.toLowerCase() });
    if (!user || !(await bcryptjs_1.default.compare(b.password, user.passwordHash))) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    res.json(session(user));
});
r.post('/password-reset/request', async (req, res) => {
    const { email } = zod_1.z.object({ email: zod_1.z.string().trim().email().max(254) }).parse(req.body);
    const user = await models_1.User.findOne({ email: email.toLowerCase() });
    if (!user) {
        res.status(202).json({ message: resetMessage });
        return;
    }
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, CLIENT_ORIGIN = 'http://localhost:5173' } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
        console.error('Password reset email is unavailable: configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.');
        res.status(202).json({ message: resetMessage });
        return;
    }
    const resetToken = (0, resetTokens_1.createResetToken)();
    const tokenHash = (0, resetTokens_1.hashResetToken)(resetToken);
    await models_1.User.updateOne({ _id: user._id }, {
        $set: { resetTokenHash: tokenHash, resetTokenExpiresAt: new Date(Date.now() + resetTokens_1.RESET_TOKEN_TTL_MS) },
    });
    try {
        const origin = CLIENT_ORIGIN.split(',')[0].trim().replace(/\/$/, '');
        const resetUrl = new URL('/forgot-password', origin);
        resetUrl.searchParams.set('token', resetToken);
        const port = Number(SMTP_PORT);
        if (!Number.isInteger(port) || port < 1 || port > 65535)
            throw new Error('SMTP_PORT must be a valid port number');
        const transporter = nodemailer_1.default.createTransport({
            host: SMTP_HOST, port, secure: port === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
        });
        await transporter.sendMail({
            from: SMTP_FROM, to: user.email, subject: 'Reset your FormForge password',
            text: `Use this link within 30 minutes to reset your FormForge password: ${resetUrl.toString()}`,
            html: `<p>Use this link within 30 minutes to reset your FormForge password:</p><p><a href="${resetUrl.toString()}">Reset password</a></p>`,
        });
    }
    catch (error) {
        console.error('Password reset email delivery failed:', error);
        try {
            await models_1.User.updateOne({ _id: user._id, resetTokenHash: tokenHash }, { $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 } });
        }
        catch (cleanupError) {
            console.error('Could not clear undelivered password reset token:', cleanupError);
        }
    }
    res.status(202).json({ message: resetMessage });
});
r.post('/password-reset/confirm', async (req, res) => {
    const { token, password } = zod_1.z.object({
        token: zod_1.z.string().min(32).max(128),
        password: zod_1.z.string().min(8).max(128),
    }).parse(req.body);
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await models_1.User.findOneAndUpdate((0, resetTokens_1.resetTokenFilter)(token), {
        $set: { passwordHash },
        $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 },
    }, { new: true });
    if (!user) {
        res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
        return;
    }
    res.json({ message: 'Your password has been updated. You can now log in.' });
});
r.get('/me', middleware_1.requireAuth, async (_req, res) => {
    const user = await models_1.User.findById(res.locals.userId);
    if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    res.json((0, models_1.publicUser)(user));
});
exports.default = r;
