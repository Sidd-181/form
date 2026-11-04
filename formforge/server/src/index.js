"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const forms_1 = __importDefault(require("./routes/forms"));
const public_1 = __importDefault(require("./routes/public"));
const settings_1 = __importDefault(require("./routes/settings"));
const middleware_1 = require("./middleware");
const { MONGODB_URI, JWT_SECRET, PORT = '4000', CLIENT_ORIGIN = 'http://localhost:5173' } = process.env;
if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('Set MONGODB_URI and a JWT_SECRET of 32+ characters (see .env.example).');
    process.exit(1);
}
const app = (0, express_1.default)();
app.use((0, helmet_1.default)(), (0, cors_1.default)({ origin: CLIENT_ORIGIN.split(',') }), express_1.default.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => { res.json({ ok: true }); });
app.use('/api/auth', (0, express_rate_limit_1.default)({ windowMs: 15 * 60_000, limit: 30 }), auth_1.default);
app.use('/api/forms', forms_1.default);
app.use('/api/settings', (0, express_rate_limit_1.default)({ windowMs: 15 * 60_000, limit: 60 }), settings_1.default);
app.use('/api/public', (0, express_rate_limit_1.default)({ windowMs: 60_000, limit: 60 }), public_1.default);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use(middleware_1.errorHandler);
mongoose_1.default.connect(MONGODB_URI).then(() => app.listen(Number(PORT), () => console.log(`API listening on :${PORT}`)))
    .catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
