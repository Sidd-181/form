"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const validate_1 = require("../validate");
const r = (0, express_1.Router)();
r.use(middleware_1.requireAuth);
const uploadDir = node_path_1.default.resolve(process.env.UPLOAD_DIR ?? 'uploads');
const own = (req, res) => {
    const id = String(req.params.id);
    return mongoose_1.default.isValidObjectId(id) ? models_1.Form.findOne({ _id: id, owner: res.locals.userId }) : null;
};
const notFound = (res) => { res.status(404).json({ error: 'Form not found' }); };
r.get('/', async (_req, res) => {
    const forms = await models_1.Form.find({ owner: res.locals.userId }).sort({ updatedAt: -1 });
    const counts = await models_1.FormResponse.aggregate([{ $match: { form: { $in: forms.map(f => f._id) } } }, { $group: { _id: '$form', n: { $sum: 1 } } }]);
    const byId = new Map(counts.map(c => [String(c._id), c.n]));
    res.json(forms.map(f => ({ ...f.toJSON(), responseCount: byId.get(String(f._id)) ?? 0 })));
});
// Latest responses across all of the user's forms (dashboard activity feed).
r.get('/activity', async (_req, res) => {
    const ids = (await models_1.Form.find({ owner: res.locals.userId }).select('_id')).map(f => f._id);
    res.json(await models_1.FormResponse.find({ form: { $in: ids } }).sort({ createdAt: -1 }).limit(20));
});
r.post('/', async (req, res) => {
    const b = validate_1.formBody.parse(req.body);
    const form = await models_1.Form.create({ ...b, expiresAt: b.expiresAt ? new Date(b.expiresAt) : null, owner: res.locals.userId });
    res.status(201).json(form);
});
r.get('/:id', async (req, res) => {
    const form = await own(req, res);
    if (!form) {
        notFound(res);
        return;
    }
    const responseCount = await models_1.FormResponse.countDocuments({ form: form._id });
    res.json({ ...form.toJSON(), responseCount });
});
r.get('/:id/files/:fileId', async (req, res, next) => {
    const form = await own(req, res);
    if (!form) {
        notFound(res);
        return;
    }
    const file = await models_1.FormUpload.findOne({ form: form._id, fileId: String(req.params.fileId) });
    if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
    }
    res.download(node_path_1.default.join(uploadDir, file.storageName), file.originalName, error => {
        if (error)
            next(error);
    });
});
// Partial update: autosave sends content only and must not reset limit/expiry.
r.patch('/:id', async (req, res) => {
    const form = await own(req, res);
    if (!form)
        return notFound(res);
    const { expiresAt, ...rest } = validate_1.formBody.partial().parse(req.body);
    form.set(rest);
    if (expiresAt !== undefined)
        form.expiresAt = expiresAt ? new Date(expiresAt) : null;
    await form.save();
    res.json(form);
});
r.post('/:id/status', async (req, res) => {
    const form = await own(req, res);
    if (!form)
        return notFound(res);
    const { status } = zod_1.z.object({ status: zod_1.z.enum(['draft', 'published']) }).parse(req.body);
    if (status === 'published' && form.fields.length === 0) {
        res.status(400).json({ error: 'Add at least one field before publishing' });
        return;
    }
    form.status = status;
    await form.save();
    res.json(form);
});
r.post('/:id/duplicate', async (req, res) => {
    const src = await own(req, res);
    if (!src)
        return notFound(res);
    const copy = await models_1.Form.create({
        owner: src.owner, title: `${src.title} (copy)`, description: src.description, accent: src.accent,
        fields: src.toObject().fields, submissionLimit: src.submissionLimit, expiresAt: src.expiresAt, status: 'draft',
    });
    res.status(201).json(copy);
});
r.delete('/:id', async (req, res) => {
    const form = await own(req, res);
    if (!form)
        return notFound(res);
    await models_1.FormResponse.deleteMany({ form: form._id });
    await form.deleteOne();
    res.status(204).end();
});
r.get('/:id/responses', async (req, res) => {
    const form = await own(req, res);
    if (!form)
        return notFound(res);
    res.json(await models_1.FormResponse.find({ form: form._id }).sort({ createdAt: -1 }));
});
r.delete('/:id/responses/:rid', async (req, res) => {
    const form = await own(req, res);
    if (!form)
        return notFound(res);
    const rid = String(req.params.rid);
    if (!mongoose_1.default.isValidObjectId(rid)) {
        res.status(404).json({ error: 'Response not found' });
        return;
    }
    const { deletedCount } = await models_1.FormResponse.deleteOne({ _id: rid, form: form._id });
    if (deletedCount)
        await models_1.Form.updateOne({ _id: form._id, submissionCount: { $gt: 0 } }, { $inc: { submissionCount: -1 } });
    deletedCount ? res.status(204).end() : res.status(404).json({ error: 'Response not found' });
});
exports.default = r;
