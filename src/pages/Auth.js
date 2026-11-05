import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Logo } from '../components/AppLayout.js';
import { Button, Input } from '../components/ui.js';
import { useAppDispatch, useAppSelector, login, signup } from '../store/index.js';
import { api } from '../services/api.js';
const email = z.string().trim().email('Enter a valid email address');
const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
const signupSchema = z.object({ name: z.string().trim().min(1, 'Enter your name'), email, password: z.string().min(8, 'Use at least 8 characters') });
function Shell({ title, subtitle, children, footer }) {
    return (_jsx("div", { className: "grid min-h-screen place-items-center bg-canvas p-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsx("div", { className: "mb-6 flex justify-center", children: _jsx(Logo, {}) }), _jsxs("div", { className: "rounded-2xl border border-line bg-white p-6", children: [_jsx("h1", { className: "text-xl font-semibold tracking-tight", children: title }), _jsx("p", { className: "mt-1 text-sm text-neutral-500", children: subtitle }), _jsx("div", { className: "mt-6", children: children })] }), _jsx("p", { className: "mt-4 text-center text-sm text-neutral-500", children: footer })] }) }));
}
const Field = ({ label, error, children }) => (_jsxs("label", { className: "block space-y-1.5", children: [_jsx("span", { className: "text-sm font-medium", children: label }), children, error && _jsx("span", { role: "alert", className: "block text-xs text-red-600", children: error })] }));
function AuthForm({ mode }) {
    const isSignup = mode === 'signup';
    const dispatch = useAppDispatch();
    const status = useAppSelector(s => s.auth.status);
    const from = useLocation().state?.from ?? '/app';
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(isSignup ? signupSchema : loginSchema) });
    const onSubmit = async (v) => {
        setServerError(null);
        try {
            if (isSignup)
                await dispatch(signup(v)).unwrap();
            else
                await dispatch(login({ email: v.email, password: v.password })).unwrap();
        }
        catch (e) {
            setServerError(e.message ?? 'Something went wrong');
        }
    };
    if (status === 'authed')
        return _jsx(Navigate, { to: from, replace: true });
    return (_jsx(Shell, { title: isSignup ? 'Create your account' : 'Welcome back', subtitle: isSignup ? 'Start building forms in minutes.' : 'Log in to your workspace.', footer: isSignup ? _jsxs(_Fragment, { children: ["Already have an account? ", _jsx(Link, { to: "/login", className: "font-medium text-accent-600", children: "Log in" })] }) : _jsxs(_Fragment, { children: ["New to FormForge? ", _jsx(Link, { to: "/signup", className: "font-medium text-accent-600", children: "Create an account" })] }), children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), noValidate: true, className: "space-y-4", children: [isSignup && _jsx(Field, { label: "Name", error: errors.name?.message, children: _jsx(Input, { autoComplete: "name", ...register('name') }) }), _jsx(Field, { label: "Email", error: errors.email?.message, children: _jsx(Input, { type: "email", autoComplete: "email", ...register('email') }) }), _jsx(Field, { label: "Password", error: errors.password?.message, children: _jsx(Input, { type: "password", autoComplete: isSignup ? 'new-password' : 'current-password', ...register('password') }) }), !isSignup && _jsx("div", { className: "text-right", children: _jsx(Link, { to: "/forgot-password", className: "text-xs text-accent-600", children: "Forgot password?" }) }), serverError && _jsx("p", { role: "alert", className: "rounded-lg bg-red-50 p-3 text-sm text-red-700", children: serverError }), _jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in' })] }) }));
}
export const Login = () => _jsx(AuthForm, { mode: "login" });
export const Signup = () => _jsx(AuthForm, { mode: "signup" });
export function ForgotPassword() {
    const [params] = useSearchParams();
    const resetToken = params.get('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const requestReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);
        if (!z.string().trim().email().safeParse(email).success) {
            setError('Enter a valid email address.');
            setLoading(false);
            return;
        }
        try {
            const result = await api.requestPasswordReset(email);
            setMessage(result.message);
        }
        catch (e) {
            setError(e.message || 'Could not request a reset link. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const submitReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        if (!resetToken) {
            setError('This password reset link is invalid or has expired.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const result = await api.resetPassword(resetToken, password);
            setMessage(result.message);
        }
        catch (e) {
            setError(e.message || 'Could not reset your password. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const finishedReset = !!resetToken && message?.startsWith('Your password has been updated.');
    return (_jsxs(Shell, { title: resetToken ? 'Choose a new password' : 'Reset your password', subtitle: resetToken ? 'Reset links expire after 30 minutes.' : 'Enter your email and we’ll send a reset link if an account exists.', footer: _jsx(Link, { to: "/login", className: "font-medium text-accent-600", children: "Back to log in" }), children: [message && _jsx("p", { role: "status", className: "mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800", children: message }), error && _jsx("p", { role: "alert", className: "mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700", children: error }), finishedReset ? _jsx(Link, { to: "/login", children: _jsx(Button, { className: "w-full", children: "Go to log in" }) }) : resetToken ? (_jsxs("form", { onSubmit: submitReset, noValidate: true, className: "space-y-4", children: [_jsxs("label", { className: "block space-y-1.5", children: [_jsx("span", { className: "text-sm font-medium", children: "New password" }), _jsx(Input, { type: "password", autoComplete: "new-password", minLength: 8, maxLength: 128, required: true, value: password, onChange: e => setPassword(e.target.value) })] }), _jsxs("label", { className: "block space-y-1.5", children: [_jsx("span", { className: "text-sm font-medium", children: "Confirm new password" }), _jsx(Input, { type: "password", autoComplete: "new-password", minLength: 8, maxLength: 128, required: true, value: confirmPassword, onChange: e => setConfirmPassword(e.target.value) })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading || password.length < 8 || confirmPassword.length < 8, children: loading ? 'Updating…' : 'Update password' })] })) : (_jsxs("form", { onSubmit: requestReset, noValidate: true, className: "space-y-4", children: [_jsxs("label", { className: "block space-y-1.5", children: [_jsx("span", { className: "text-sm font-medium", children: "Email" }), _jsx(Input, { type: "email", autoComplete: "email", required: true, maxLength: 254, value: email, onChange: e => setEmail(e.target.value) })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading || !email.trim(), children: loading ? 'Sending…' : 'Send reset link' })] }))] }));
}
