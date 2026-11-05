"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_UPLOAD_SIZE_MB = exports.MAX_UPLOAD_SIZE = void 0;
exports.maxFileSizeForField = maxFileSizeForField;
exports.getAllowedFileType = getAllowedFileType;
const MB = 1024 * 1024;
const configuredMax = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 10 * MB);
if (!Number.isSafeInteger(configuredMax) || configuredMax < 1) {
    throw new Error('MAX_UPLOAD_SIZE_BYTES must be a positive safe integer');
}
exports.MAX_UPLOAD_SIZE = configuredMax;
exports.MAX_UPLOAD_SIZE_MB = exports.MAX_UPLOAD_SIZE / MB;
function maxFileSizeForField(fieldMaxMb) {
    return fieldMaxMb == null ? exports.MAX_UPLOAD_SIZE : Math.min(exports.MAX_UPLOAD_SIZE, Math.floor(fieldMaxMb * MB));
}
const fileTypes = {
    'image/png': { extension: '.png', signature: b => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
    'image/jpeg': { extension: '.jpg', signature: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    'application/pdf': { extension: '.pdf', signature: b => b.subarray(0, 5).toString('ascii') === '%PDF-' },
};
function getAllowedFileType(mimeType, buffer, size, maximumSize = exports.MAX_UPLOAD_SIZE) {
    const type = fileTypes[mimeType];
    return size > 0 && size <= maximumSize && size <= exports.MAX_UPLOAD_SIZE && type?.signature(buffer) ? type : null;
}
