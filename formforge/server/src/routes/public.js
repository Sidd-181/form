"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const validate_1 = require("../validate");
const uploadPolicy_1 = require("../uploadPolicy");
const submissionLimit_1 = require("../submissionLimit");
const r = (0, express_1.Router)();
const uploadDir = node_path_1.default.resolve(process.env.UPLOAD_DIR ?? 'uploads');
function parseUpload(req, res, next) {
    const form = res.locals.uploadForm;
    const field = form.fields.find(f => f.id === String(req.params.fieldId));
    const limit = (0, uploadPolicy_1.maxFileSizeForField)(field?.max);
    (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: limit, files: 1 } }).single('file')(req, res, error => {
        if (!error) {
            next();
            return;
        }
        if (error instanceof multer_1.default.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: `File must be ${limit / 1024 / 1024} MB or smaller` });
            return;
        }
        res.status(400).json({ error: 'Invalid file upload' });
    });
}
async function validateUploadTarget(req, res, next) {
    const o = await openForm(String(req.params.id));
    if (o.err) {
        res.status(o.err.status).json({ code: o.err.code, message: o.err.message });
        return;
    }
    const field = o.form.fields.find(f => f.id === String(req.params.fieldId));
    if (!field || field.type !== 'file') {
        res.status(404).json({ error: 'File field not found' });
        return;
    }
    res.locals.uploadForm = o.form;
    next();
}
const fail = (status, code, message, title) => ({ form: null, err: { status, code, message, title } });
// Resolves a form for respondents, or the reason it is closed.
async function openForm(id, checkLimit = true) {
    if (!mongoose_1.default.isValidObjectId(id))
        return fail(404, 'not_found', 'Form not found');
    const form = await models_1.Form.findById(id);
    if (!form)
        return fail(404, 'not_found', 'Form not found');
    const closed = (status, code, message) => fail(status, code, message, form.title);
    if (form.status !== 'published')
        return closed(403, 'unpublished', 'This form is not accepting responses.');
    if (form.expiresAt && form.expiresAt <= new Date())
        return closed(410, 'expired', 'This form has expired.');
    if (checkLimit && form.submissionLimit && (await models_1.FormResponse.countDocuments({ form: form._id })) >= form.submissionLimit) {
        return closed(410, 'limit_reached', 'This form has reached its submission limit.');
    }
    return { form, err: null };
}
async function reserveSubmission(form) {
    if (!form.submissionLimit)
        return null;
    const current = await models_1.Form.findById(form._id).select('submissionCount');
    if (current?.submissionCount == null) {
        const count = await models_1.FormResponse.countDocuments({ form: form._id });
        await models_1.Form.updateOne({ _id: form._id, submissionCount: { $exists: false } }, { $set: { submissionCount: count } });
    }
    const reserved = await models_1.Form.findOneAndUpdate((0, submissionLimit_1.submissionReservationFilter)(form._id), { $inc: { submissionCount: 1 } }, { new: true });
    return reserved ? true : false;
}
r.get('/forms/:id', async (req, res) => {
    const o = await openForm(String(req.params.id));
    if (o.err) {
        res.status(o.err.status).json({ code: o.err.code, message: o.err.message, title: o.err.title });
        return;
    }
    await models_1.Form.updateOne({ _id: o.form._id }, { $inc: { views: 1 } });
    const { id, title, description, accent, fields } = o.form.toJSON();
    res.json({ id, title, description, accent, fields, maxUploadSizeBytes: uploadPolicy_1.MAX_UPLOAD_SIZE });
});
r.post('/forms/:id/uploads/:fieldId', validateUploadTarget, parseUpload, async (req, res) => {
    const form = res.locals.uploadForm;
    const fieldId = String(req.params.fieldId);
    const file = req.file;
    if (file?.size === 0) {
        res.status(400).json({ error: 'File cannot be empty' });
        return;
    }
    const field = form.fields.find(f => f.id === fieldId);
    const limit = (0, uploadPolicy_1.maxFileSizeForField)(field?.max);
    const type = file && (0, uploadPolicy_1.getAllowedFileType)(file.mimetype, file.buffer, file.size, limit);
    if (!file || !type) {
        res.status(415).json({ error: 'Upload a PNG, JPEG, or PDF file' });
        return;
    }
    const fileId = (0, node_crypto_1.randomUUID)();
    const storageName = `${fileId}${type.extension}`;
    const originalName = node_path_1.default.basename(file.originalname.replace(/\\/g, '/')).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255) || 'upload';
    await (0, promises_1.mkdir)(uploadDir, { recursive: true });
    const filePath = node_path_1.default.join(uploadDir, storageName);
    await (0, promises_1.writeFile)(filePath, file.buffer, { flag: 'wx' });
    try {
        await models_1.FormUpload.create({ form: form._id, fieldId, fileId, storageName, originalName, mimeType: file.mimetype, size: file.size });
    }
    catch (error) {
        await (0, promises_1.unlink)(filePath);
        throw error;
    }
    res.status(201).json({ fileId, name: originalName, size: file.size, mimeType: file.mimetype });
});
r.post('/forms/:id/responses', async (req, res) => {
    const o = await openForm(String(req.params.id), false);
    if (o.err) {
        res.status(o.err.status).json({ code: o.err.code, message: o.err.message });
        return;
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { errors, clean } = (0, validate_1.checkAnswers)(o.form.fields, body.answers && typeof body.answers === 'object' ? body.answers : {});
    if (Object.keys(errors).length) {
        res.status(422).json({ code: 'invalid', errors });
        return;
    }
    for (const field of o.form.fields.filter(f => f.type === 'file')) {
        const answer = clean[field.id];
        if (!answer)
            continue;
        const file = await models_1.FormUpload.findOne({ fileId: answer.fileId, form: o.form._id, fieldId: field.id });
        if (!file) {
            errors[field.id] = 'Upload a valid file';
            continue;
        }
        clean[field.id] = {
            fileId: file.fileId,
            name: file.originalName,
            size: file.size,
            mimeType: file.mimeType,
            url: `/api/forms/${o.form.id}/files/${file.fileId}`,
        };
    }
    if (Object.keys(errors).length) {
        res.status(422).json({ code: 'invalid', errors });
        return;
    }
    const latest = await openForm(String(req.params.id), false);
    if (latest.err) {
        res.status(latest.err.status).json({ code: latest.err.code, message: latest.err.message });
        return;
    }
    const reserved = await reserveSubmission(latest.form);
    if (!reserved) {
        const state = await openForm(String(req.params.id), false);
        if (state.err) {
            res.status(state.err.status).json({ code: state.err.code, message: state.err.message });
            return;
        }
        if (state.form.submissionLimit != null) {
            res.status(410).json({ code: 'limit_reached', message: 'This form has reached its submission limit.' });
            return;
        }
    }
    const secs = Number(body.completionSeconds);
    try {
        await models_1.FormResponse.create({
            form: latest.form._id,
            answers: clean,
            fieldSnapshots: o.form.fields.map(field => typeof field.toObject === 'function' ? field.toObject() : { ...field }),
            completionSeconds: Number.isFinite(secs) && secs >= 0 && secs < 86400 ? Math.round(secs) : null,
        });
    }
    catch (error) {
        if (reserved === true) {
            try {
                await models_1.Form.updateOne({ _id: latest.form._id, submissionCount: { $gt: 0 } }, { $inc: { submissionCount: -1 } });
            }
            catch (rollbackError) {
                console.error('Could not roll back form submission reservation:', rollbackError);
            }
        }
        throw error;
    }
    res.status(201).json({ ok: true });
});
exports.default = r;
