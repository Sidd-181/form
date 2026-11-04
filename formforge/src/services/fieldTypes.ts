import { Type, AlignLeft, Mail, Hash, Phone, ChevronsUpDown, CircleDot, CheckSquare, Calendar, Star, Upload, type LucideIcon } from 'lucide-react'
import type { Field, FieldType } from '../types'
import { uid } from './uid'

export const FIELD_TYPES: { type: FieldType; label: string; icon: LucideIcon; group: string }[] = [
  { type: 'short_text', label: 'Short text', icon: Type, group: 'Text' },
  { type: 'long_text', label: 'Long text', icon: AlignLeft, group: 'Text' },
  { type: 'email', label: 'Email', icon: Mail, group: 'Text' },
  { type: 'number', label: 'Number', icon: Hash, group: 'Text' },
  { type: 'phone', label: 'Phone', icon: Phone, group: 'Text' },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronsUpDown, group: 'Choice' },
  { type: 'multiple_choice', label: 'Multiple choice', icon: CircleDot, group: 'Choice' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, group: 'Choice' },
  { type: 'date', label: 'Date', icon: Calendar, group: 'Other' },
  { type: 'rating', label: 'Rating', icon: Star, group: 'Other' },
  { type: 'file', label: 'File upload', icon: Upload, group: 'Other' },
]
export const typeMeta = (t: FieldType) => FIELD_TYPES.find(x => x.type === t)!
export const hasOptions = (t: FieldType) => t === 'dropdown' || t === 'multiple_choice'
export const hasPlaceholder = (t: FieldType) => ['short_text', 'long_text', 'email', 'number', 'phone', 'dropdown', 'checkbox'].includes(t)

export function newField(type: FieldType, label?: string, required = false, options?: string[]): Field {
  return {
    id: uid(), type, label: label ?? typeMeta(type).label, required,
    options: options ?? (hasOptions(type) ? ['Option 1', 'Option 2'] : undefined),
    max: type === 'rating' ? 5 : undefined,
  }
}
