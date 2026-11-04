export type FieldType = 'short_text' | 'long_text' | 'email' | 'number' | 'phone' | 'dropdown' | 'multiple_choice' | 'checkbox' | 'date' | 'rating' | 'file'
export interface Field { id: string; type: FieldType; label: string; description?: string; placeholder?: string; required: boolean; options?: string[]; min?: number; max?: number }
export interface Form { id: string; title: string; description: string; status: 'draft' | 'published'; fields: Field[]; accent: string; createdAt: string; updatedAt: string; responseCount?: number; views?: number; submissionLimit?: number | null; expiresAt?: string | null }
export interface User { id: string; name: string; email: string; workspaceName: string; defaultAccent: string; notifications: { newResponse: boolean; weeklyDigest: boolean } }
export interface FormResponse { id: string; formId: string; submittedAt: string; completionSeconds?: number | null; answers: Record<string, string | string[] | number> }
