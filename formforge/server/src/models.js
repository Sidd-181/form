"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicUser = exports.FormUpload = exports.FormResponse = exports.Form = exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Expose `id`, hide internals when sending JSON to the client.
const toJSON = {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = String(ret._id);
        if (ret.createdAt && ret.form)
            ret.submittedAt = ret.createdAt;
        delete ret._id;
        delete ret.passwordHash;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiresAt;
        delete ret.owner;
        if (ret.form)
            ret.formId = String(ret.form);
        delete ret.form;
        return ret;
    },
};
const User = mongoose_1.default.model('User', new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    workspaceName: { type: String, default: '', trim: true },
    notifications: { newResponse: { type: Boolean, default: true }, weeklyDigest: { type: Boolean, default: false } },
    defaultAccent: { type: String, default: '#4f46e5' },
}, { timestamps: true, toJSON }));
exports.User = User;
const fieldSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true, enum: ['short_text', 'long_text', 'email', 'number', 'phone', 'dropdown', 'multiple_choice', 'checkbox', 'date', 'rating', 'file'] },
    label: { type: String, default: '' }, description: String, placeholder: String,
    required: { type: Boolean, default: false }, options: [String], min: Number, max: Number,
}, { _id: false });
const Form = mongoose_1.default.model('Form', new mongoose_1.Schema({
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    fields: [fieldSchema],
    accent: { type: String, default: '#4f46e5' },
    submissionLimit: { type: Number, default: null },
    submissionCount: { type: Number },
    expiresAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
}, { timestamps: true, toJSON }));
exports.Form = Form;
const FormResponse = mongoose_1.default.model('Response', new mongoose_1.Schema({
    form: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
    answers: { type: mongoose_1.Schema.Types.Mixed, required: true },
    fieldSnapshots: { type: [fieldSchema], default: [] },
    completionSeconds: { type: Number, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON }));
exports.FormResponse = FormResponse;
const FormUpload = mongoose_1.default.model('FormUpload', new mongoose_1.Schema({
    form: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
    fieldId: { type: String, required: true },
    fileId: { type: String, required: true, unique: true },
    storageName: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
}, { timestamps: true }));
exports.FormUpload = FormUpload;
const publicUser = (u) => ({
    id: String(u._id), name: u.name, email: u.email, workspaceName: u.workspaceName ?? '', defaultAccent: u.defaultAccent ?? '#4f46e5',
    notifications: { newResponse: u.notifications?.newResponse ?? true, weeklyDigest: u.notifications?.weeklyDigest ?? false },
});
exports.publicUser = publicUser;
