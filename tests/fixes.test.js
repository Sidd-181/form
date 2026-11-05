import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FormRenderer from "../src/components/FormRenderer.js";
import { firstInvalidField, validateAll, validateField, validateFieldDefinition, validateFormContent } from "../src/services/validation.js";
import { createResetToken, hashResetToken, resetTokenFilter, RESET_TOKEN_TTL_MS } from "../server/src/resetTokens.js";
import { submissionReservationFilter } from "../server/src/submissionLimit.js";
import { getAllowedFileType, MAX_UPLOAD_SIZE, maxFileSizeForField } from "../server/src/uploadPolicy.js";
import { checkAnswers, fieldSchema } from "../server/src/validate.js";
import { createLatestSaveQueue } from "../src/services/saveQueue.js";
import { responseDeleted, store } from "../src/store/index.js";
import { answerForResponseField, fieldsForResponse, responseFieldColumns } from "../src/services/responses.js";
test("public file upload policy checks the signature, MIME type, and size", () => {
  const MB = 1024 * 1024;
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(getAllowedFileType("image/png", png, png.length)?.extension, ".png");
  assert.equal(getAllowedFileType("image/jpeg", png, png.length), null);
  assert.equal(getAllowedFileType("image/png", png, MAX_UPLOAD_SIZE + 1), null);
  assert.equal(maxFileSizeForField(1), Math.min(MAX_UPLOAD_SIZE, MB));
  assert.equal(getAllowedFileType("image/png", png, maxFileSizeForField(1) + 1, maxFileSizeForField(1)), null);
  assert.equal(getAllowedFileType("image/png", Buffer.alloc(0), 0), null);
});
test("file answers require a real-looking upload reference and frontend rejects missing files", () => {
  const fileField = fieldSchema.parse({ id: "attachment", type: "file", label: "Attachment", required: true });
  assert.equal(checkAnswers([fileField], { attachment: "report.pdf" }).errors.attachment, "Upload a valid file");
  const fileAnswer = { fileId: "16f2a0cb-e2af-4e78-8f36-06b94f14f1b1" };
  assert.deepEqual(checkAnswers([fileField], { attachment: fileAnswer }).errors, {});
  assert.equal(validateField(fileField, void 0), "This field is required");
  assert.equal(validateField(fileField, { ...fileAnswer, name: "report.pdf", size: 12, mimeType: "application/pdf" }), null);
});
test("backend and frontend enforce choice options and answer restrictions consistently", () => {
  const blankOptions = { id: "choice", type: "dropdown", label: "Choice", required: false, options: [" ", "Yes"] };
  const duplicateOptions = { ...blankOptions, options: ["Yes", " yes "] };
  const validOptions = { ...blankOptions, options: ["Yes", "No"] };
  assert.equal(fieldSchema.safeParse(blankOptions).success, false);
  assert.equal(validateFieldDefinition(blankOptions), "Options cannot be empty");
  assert.equal(fieldSchema.safeParse(duplicateOptions).success, false);
  assert.equal(validateFieldDefinition(duplicateOptions), "Options must be unique");
  assert.equal(fieldSchema.safeParse(validOptions).success, true);
  assert.equal(validateFieldDefinition(validOptions), null);
  assert.equal(validateFormContent({ title: "Form", description: "", accent: "#4f46e5", fields: [validOptions] }), null);
  assert.notEqual(validateFormContent({ title: " ", description: "", accent: "#4f46e5", fields: [] }), null);
  assert.notEqual(validateFormContent({ title: "Form", description: "x".repeat(2001), accent: "#4f46e5", fields: [] }), null);
  const textField = fieldSchema.parse({ id: "text", type: "short_text", label: "Text", required: false });
  const tooLong = "x".repeat(5001);
  assert.equal(checkAnswers([textField], { text: tooLong }).errors.text, validateField(textField, tooLong));
  assert.equal(validateField(textField, 12), "Enter text");
  const ratingField = fieldSchema.parse({ id: "rating", type: "rating", label: "Rating", required: true });
  assert.deepEqual(checkAnswers([ratingField], { rating: 4 }), { errors: {}, clean: { rating: 4 } });
  assert.equal(validateField(ratingField, 4), null);
  assert.equal(checkAnswers([{ ...ratingField, type: "checkbox" }], { rating: "yes" }).errors.rating, "Choose a valid checkbox value");
  assert.equal(validateField({ ...ratingField, type: "checkbox" }, "yes"), "Choose a valid checkbox value");
});
test("autosave serializes requests and persists the newest snapshot after an in-flight save", async () => {
  const calls = [];
  const releases = [];
  const queue = createLatestSaveQueue((snapshot) => {
    calls.push(snapshot.revision);
    return new Promise((resolve) => releases.push(resolve));
  });
  queue.setLatest({ revision: 1 });
  const saving = queue.flush();
  await new Promise((resolve) => setImmediate(resolve));
  queue.setLatest({ revision: 2 });
  assert.deepEqual(calls, [1]);
  releases[0]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, [1, 2]);
  releases[1]();
  await saving;
  assert.equal(queue.isSaved(), true);
});
test("autosave retries the newest snapshot if an older in-flight save fails", async () => {
  const calls = [];
  const pending = [];
  const queue = createLatestSaveQueue((snapshot) => {
    calls.push(snapshot.revision);
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  });
  queue.setLatest({ revision: 1 });
  const saving = queue.flush();
  await new Promise((resolve) => setImmediate(resolve));
  queue.setLatest({ revision: 2 });
  pending[0].reject(new Error("stale save failed"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, [1, 2]);
  pending[1].resolve();
  await saving;
  assert.equal(queue.isSaved(), true);
});
test("successful response deletion updates dashboard counts and activity immediately", () => {
  store.dispatch({
    type: "app/load/fulfilled",
    payload: {
      forms: [{ id: "form-1", responseCount: 1 }],
      responses: [{ id: "response-1", formId: "form-1" }]
    }
  });
  store.dispatch(responseDeleted({ formId: "form-1", responseId: "response-1" }));
  assert.equal(store.getState().forms.find((form) => form.id === "form-1")?.responseCount, 0);
  assert.equal(store.getState().responses.some((response) => response.id === "response-1"), false);
});
test("historical responses keep deleted and renamed field labels for display and CSV columns", () => {
  const currentFields = [{ id: "name", type: "short_text", label: "Preferred name", required: false }];
  const olderField = { id: "name", type: "short_text", label: "Full name", required: false };
  const olderResponse = { answers: { name: "Ada" }, fieldSnapshots: [olderField] };
  const columns = responseFieldColumns([olderResponse], currentFields);
  assert.deepEqual(columns.map((field) => field.label), ["Preferred name", "Full name"]);
  assert.equal(fieldsForResponse(olderResponse, currentFields)[0].label, "Full name");
  assert.equal(answerForResponseField(olderResponse, olderField, currentFields), "Ada");
  assert.equal(answerForResponseField(olderResponse, currentFields[0], currentFields), "");
  assert.deepEqual(fieldsForResponse({ answers: { name: "Grace" } }, currentFields), currentFields);
});
test("radio groups render unique labelled input IDs and first-invalid selection points to the group", () => {
  const fields = [
    { id: "color", type: "multiple_choice", label: "Color", options: ["Red", "Blue"], required: true },
    { id: "agree", type: "checkbox", label: "Agreement", placeholder: "I agree", required: true }
  ];
  const errors = validateAll(fields, {});
  assert.equal(firstInvalidField(fields, errors)?.id, "color");
  const props = {
    form: { title: "Form", description: "", accent: "#4f46e5", fields },
    onSubmit: async () => {
    }
  };
  const markup = renderToStaticMarkup(React.createElement(FormRenderer, props));
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.match(markup, /<legend id="field-[^-]+-0-label"[^>]*>Color/);
  const firstRadioId = markup.match(/<input id="([^"]+)" type="radio"/)?.[1];
  assert.ok(firstRadioId);
  assert.match(markup, new RegExp(`<label for="${firstRadioId}">Red<\\/label>`));
  assert.match(markup, /<fieldset[^>]*><legend id="field-[^-]+-1-label"[^>]*>Agreement/);
  const checkboxId = markup.match(/<input id="([^"]+)" type="checkbox"/)?.[1];
  assert.ok(checkboxId);
  assert.match(markup, new RegExp(`<label for="${checkboxId}">I agree<\\/label>`));
  assert.doesNotMatch(markup, /<label[^>]*>\s*<input/);
});
test("reset tokens are random, hashed, and expire within the configured interval", () => {
  const first = createResetToken();
  const second = createResetToken();
  assert.equal(first.length, 43);
  assert.notEqual(first, second);
  assert.match(hashResetToken(first), /^[0-9a-f]{64}$/);
  assert.notEqual(hashResetToken(first), first);
  assert.equal(RESET_TOKEN_TTL_MS, 30 * 6e4);
  assert.deepEqual(resetTokenFilter(first, /* @__PURE__ */ new Date(0)), {
    resetTokenHash: hashResetToken(first),
    resetTokenExpiresAt: { $gt: /* @__PURE__ */ new Date(0) }
  });
});
test("concurrent conditional reservations never exceed the configured submission limit", async () => {
  const filter = submissionReservationFilter("form-id", /* @__PURE__ */ new Date("2026-01-01T00:00:00Z"));
  assert.deepEqual(filter.submissionLimit, { $gt: 0 });
  assert.deepEqual(filter.$expr, { $lt: [{ $ifNull: ["$submissionCount", 0] }, "$submissionLimit"] });
  assert.equal(filter.status, "published");
  const limit = 7;
  const form = { status: "published", submissionLimit: limit, submissionCount: 0 };
  const reserveAtomically = async () => {
    await Promise.resolve();
    if (form.status !== "published" || !(form.submissionCount < form.submissionLimit)) return false;
    form.submissionCount += 1;
    return true;
  };
  const results = await Promise.all(Array.from({ length: 60 }, () => reserveAtomically()));
  assert.equal(results.filter(Boolean).length, limit);
  assert.equal(form.submissionCount, limit);
});
