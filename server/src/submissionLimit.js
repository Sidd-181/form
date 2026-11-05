"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionReservationFilter = submissionReservationFilter;
function submissionReservationFilter(formId, now = new Date()) {
    return {
        _id: formId,
        status: 'published',
        submissionLimit: { $gt: 0 },
        $expr: { $lt: [{ $ifNull: ['$submissionCount', 0] }, '$submissionLimit'] },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };
}
