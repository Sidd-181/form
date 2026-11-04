// Client-side mirror of the server's rules (server/src/validate.js). The server remains the source of truth.
export function validateField(f, v) {
    const empty = v === undefined || v === '' || (typeof v === 'string' && v.trim() === '') || v === false || (Array.isArray(v) && v.length === 0);
    if (empty)
        return f.required ? 'This field is required' : null;
    if (f.type === 'file')
        return typeof v === 'object' && 'fileId' in v && /^[0-9a-f-]{36}$/i.test(v.fileId) ? null : 'Upload a valid file';
    const s = String(v).trim();
    switch (f.type) {
        case 'short_text':
        case 'long_text':
            if (typeof v !== 'string')
                return 'Enter text';
            if (s.length > 5000)
                return 'Must be at most 5,000 characters';
            if (f.min != null && s.length < f.min)
                return `Must be at least ${f.min} characters`;
            if (f.max != null && s.length > f.max)
                return `Must be at most ${f.max} characters`;
            return null;
        case 'email': return typeof v === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : 'Enter a valid email address';
        case 'phone': return typeof v === 'string' && /^[+\d][\d\s()-]{5,19}$/.test(s) ? null : 'Enter a valid phone number';
        case 'number': {
            if (typeof v !== 'number' && typeof v !== 'string')
                return 'Enter a valid number';
            const n = Number(s);
            if (!Number.isFinite(n))
                return 'Enter a valid number';
            if (f.min != null && n < f.min)
                return `Must be at least ${f.min}`;
            if (f.max != null && n > f.max)
                return `Must be at most ${f.max}`;
            return null;
        }
        case 'dropdown':
        case 'multiple_choice': return typeof v === 'string' && (f.options ?? []).some(option => option.trim() === s) ? null : 'Choose one of the available options';
        case 'rating': return (typeof v === 'number' || typeof v === 'string') && Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= (f.max ?? 5) ? null : 'Choose a rating';
        case 'checkbox': return typeof v === 'boolean' ? null : 'Choose a valid checkbox value';
        case 'date': return typeof v === 'string' && Number.isFinite(Date.parse(s)) ? null : 'Enter a valid date';
        default: return null;
    }
}
export function validateAll(fields, values) {
    const errors = {};
    for (const f of fields) {
        const e = validateField(f, values[f.id]);
        if (e)
            errors[f.id] = e;
    }
    return errors;
}
export function firstInvalidField(fields, errors) {
    return fields.find(field => errors[field.id]);
}
export function validateFieldDefinition(field) {
    if (!field.id || field.id.length > 40)
        return 'Field ID must contain between 1 and 40 characters';
    if (field.label.length > 300)
        return 'Question label must be at most 300 characters';
    if (field.description != null && field.description.length > 1000)
        return 'Description must be at most 1,000 characters';
    if (field.placeholder != null && field.placeholder.length > 300)
        return 'Placeholder must be at most 300 characters';
    if (field.type === 'dropdown' || field.type === 'multiple_choice') {
        const options = field.options ?? [];
        if (options.length > 100 || options.some(option => option.length > 200))
            return 'Options must be at most 200 characters each and limited to 100';
        if (!options.length || options.some(option => !option.trim()))
            return 'Options cannot be empty';
        const normalized = options.map(option => option.trim().toLocaleLowerCase());
        if (new Set(normalized).size !== normalized.length)
            return 'Options must be unique';
    }
    else if (field.options && (field.options.length > 100 || field.options.some(option => option.length > 200))) {
        return 'Options must be at most 200 characters each and limited to 100';
    }
    if (field.type === 'short_text' || field.type === 'long_text') {
        if (field.min != null && (!Number.isInteger(field.min) || field.min < 0 || field.min > 5000))
            return 'Text minimum must be between 0 and 5,000';
        if (field.max != null && (!Number.isInteger(field.max) || field.max < 0 || field.max > 5000))
            return 'Text maximum must be between 0 and 5,000';
    }
    if (field.min != null && field.max != null && field.min > field.max)
        return 'Maximum must not be less than minimum';
    if (field.type === 'number' && ((field.min != null && !Number.isFinite(field.min)) || (field.max != null && !Number.isFinite(field.max))))
        return 'Number bounds must be finite';
    if (field.type === 'rating' && field.max != null && (!Number.isInteger(field.max) || field.max < 3 || field.max > 10))
        return 'Rating maximum must be between 3 and 10';
    if (field.type === 'file' && field.max != null && (!Number.isFinite(field.max) || field.max < 1))
        return 'File size maximum must be at least 1 MB';
    return null;
}
export function validateFieldDefinitions(fields) {
    const errors = {};
    if (fields.length > 100) {
        for (const field of fields.slice(100))
            errors[field.id] = 'Forms may have at most 100 fields';
    }
    const ids = new Set();
    fields.forEach(field => {
        const error = validateFieldDefinition(field);
        if (error)
            errors[field.id] = error;
        if (ids.has(field.id))
            errors[field.id] = 'Field IDs must be unique';
        ids.add(field.id);
    });
    return errors;
}
export function validateFormContent(form) {
    if (!form.title.trim() || form.title.trim().length > 200)
        return 'Form title must contain 1 to 200 characters';
    if (form.description.length > 2000)
        return 'Description must be at most 2,000 characters';
    if (!/^#[0-9a-fA-F]{6}$/.test(form.accent))
        return 'Choose a valid accent color';
    return Object.values(validateFieldDefinitions(form.fields))[0] ?? null;
}
