import { newField } from './fieldTypes.js';
import { uid } from './uid.js';
export const CATEGORIES = ['Customer Feedback', 'Event Registration', 'Contact Form', 'Job Application', 'Survey', 'Product Feedback'];
export const TEMPLATES = [
    { id: 't-csat', category: 'Customer Feedback', title: 'Customer satisfaction', description: 'Measure how happy customers are after a purchase or support chat.',
        fields: [['rating', 'How satisfied are you overall?', true], ['multiple_choice', 'What mattered most?', false, ['Speed', 'Quality', 'Price', 'Support']], ['long_text', 'How could we improve?'], ['email', 'Email (optional)']] },
    { id: 't-event', category: 'Event Registration', title: 'Event registration', description: 'Collect attendee details, session choice and dietary needs.',
        fields: [['short_text', 'Full name', true], ['email', 'Email', true], ['phone', 'Phone'], ['dropdown', 'Session', true, ['Morning', 'Afternoon', 'Full day']], ['checkbox', 'I agree to the event code of conduct', true]] },
    { id: 't-contact', category: 'Contact Form', title: 'Contact us', description: 'A simple inbox form for website visitors.',
        fields: [['short_text', 'Name', true], ['email', 'Email', true], ['dropdown', 'Topic', false, ['Sales', 'Support', 'Partnership', 'Other']], ['long_text', 'Message', true]] },
    { id: 't-job', category: 'Job Application', title: 'Job application', description: 'Screen candidates with contact info, experience and a résumé upload.',
        fields: [['short_text', 'Full name', true], ['email', 'Email', true], ['phone', 'Phone'], ['number', 'Years of experience', true], ['file', 'Résumé', true], ['long_text', 'Why do you want to join us?']] },
    { id: 't-survey', category: 'Survey', title: 'Team pulse survey', description: 'A quick recurring check-in on team morale.',
        fields: [['rating', 'How was your week?', true], ['multiple_choice', 'Workload this week', true, ['Too light', 'About right', 'Too heavy']], ['long_text', 'Anything blocking you?'], ['date', 'Date']] },
    { id: 't-product', category: 'Product Feedback', title: 'Feature feedback', description: 'Learn which features people love and what to build next.',
        fields: [['dropdown', 'Which feature are you rating?', true, ['Editor', 'Templates', 'Analytics', 'Sharing']], ['rating', 'How useful is it?', true], ['long_text', 'What is missing?'], ['checkbox', 'You may contact me about my feedback']] },
];
export function buildForm(t) {
    const now = new Date().toISOString();
    return {
        id: uid(), title: t?.title ?? 'Untitled form', description: t?.description ?? '', status: 'draft', accent: '#4f46e5', createdAt: now, updatedAt: now,
        fields: t ? t.fields.map(([type, label, req, opts]) => newField(type, label, !!req, opts)) : [newField('short_text', 'Your name', true)],
    };
}
