import mongoose, { Schema } from 'mongoose'

// Expose `id`, hide internals when sending JSON to the client.
const toJSON = {
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, any>) => {
    ret.id = String(ret._id)
    if (ret.createdAt && ret.form) ret.submittedAt = ret.createdAt
    delete ret._id; delete ret.passwordHash; delete ret.owner
    if (ret.form) ret.formId = String(ret.form)
    delete ret.form
    return ret
  },
}

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  workspaceName: { type: String, default: '', trim: true },
  notifications: { newResponse: { type: Boolean, default: true }, weeklyDigest: { type: Boolean, default: false } },
  defaultAccent: { type: String, default: '#4f46e5' },
}, { timestamps: true, toJSON }))

const fieldSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['short_text', 'long_text', 'email', 'number', 'phone', 'dropdown', 'multiple_choice', 'checkbox', 'date', 'rating', 'file'] },
  label: { type: String, default: '' }, description: String, placeholder: String,
  required: { type: Boolean, default: false }, options: [String], min: Number, max: Number,
}, { _id: false })

const Form = mongoose.model('Form', new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  fields: [fieldSchema],
  accent: { type: String, default: '#4f46e5' },
  submissionLimit: { type: Number, default: null },
  expiresAt: { type: Date, default: null },
  views: { type: Number, default: 0 },
}, { timestamps: true, toJSON }))

const FormResponse = mongoose.model('Response', new Schema({
  form: { type: Schema.Types.ObjectId, ref: 'Form', required: true, index: true },
  answers: { type: Schema.Types.Mixed, required: true },
  completionSeconds: { type: Number, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON }))

const publicUser = (u: InstanceType<typeof User>) => ({
  id: String(u._id), name: u.name, email: u.email, workspaceName: u.workspaceName ?? '', defaultAccent: u.defaultAccent ?? '#4f46e5',
  notifications: { newResponse: u.notifications?.newResponse ?? true, weeklyDigest: u.notifications?.weeklyDigest ?? false },
})

export { User, Form, FormResponse, publicUser }
