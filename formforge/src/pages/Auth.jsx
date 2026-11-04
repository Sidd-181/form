import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Logo } from '../components/AppLayout';
import { Button, Input } from '../components/ui';
import { useAppDispatch, useAppSelector, login, signup } from '../store';
import { api } from '../services/api';
const email = z.string().trim().email('Enter a valid email address');
const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
const signupSchema = z.object({ name: z.string().trim().min(1, 'Enter your name'), email, password: z.string().min(8, 'Use at least 8 characters') });
function Shell({ title, subtitle, children, footer }) {
    return (<div className="grid min-h-screen place-items-center bg-canvas p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-line bg-white p-6">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-4 text-center text-sm text-neutral-500">{footer}</p>
      </div>
    </div>);
}
const Field = ({ label, error, children }) => (<label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}{error && <span role="alert" className="block text-xs text-red-600">{error}</span>}</label>);
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
        return <Navigate to={from} replace/>;
    return (<Shell title={isSignup ? 'Create your account' : 'Welcome back'} subtitle={isSignup ? 'Start building forms in minutes.' : 'Log in to your workspace.'} footer={isSignup ? <>Already have an account? <Link to="/login" className="font-medium text-accent-600">Log in</Link></> : <>New to FormForge? <Link to="/signup" className="font-medium text-accent-600">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {isSignup && <Field label="Name" error={errors.name?.message}><Input autoComplete="name" {...register('name')}/></Field>}
        <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register('email')}/></Field>
        <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} {...register('password')}/></Field>
        {!isSignup && <div className="text-right"><Link to="/forgot-password" className="text-xs text-accent-600">Forgot password?</Link></div>}
        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}</Button>
      </form>
    </Shell>);
}
export const Login = () => <AuthForm mode="login"/>;
export const Signup = () => <AuthForm mode="signup"/>;
export function ForgotPassword() {
    const [params] = useSearchParams();
    const resetToken = params.get('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const requestReset = async e => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        if (!z.string().trim().email().safeParse(email).success) {
            setError('Enter a valid email address.');
            return;
        }
        setLoading(true);
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
    const submitReset = async e => {
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
    return (<Shell title={resetToken ? 'Choose a new password' : 'Reset your password'} subtitle={resetToken ? 'Reset links expire after 30 minutes.' : 'Enter your email and we’ll send a reset link if an account exists.'} footer={<Link to="/login" className="font-medium text-accent-600">Back to log in</Link>}>
      {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {finishedReset ? <Link to="/login"><Button className="w-full">Go to log in</Button></Link> : resetToken ? (
        <form onSubmit={submitReset} noValidate className="space-y-4">
          <label className="block space-y-1.5"><span className="text-sm font-medium">New password</span><Input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)}/></label>
          <label className="block space-y-1.5"><span className="text-sm font-medium">Confirm new password</span><Input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/></label>
          <Button type="submit" className="w-full" disabled={loading || password.length < 8 || confirmPassword.length < 8}>{loading ? 'Updating…' : 'Update password'}</Button>
        </form>
      ) : (
        <form onSubmit={requestReset} noValidate className="space-y-4">
          <label className="block space-y-1.5"><span className="text-sm font-medium">Email</span><Input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)}/></label>
          <Button type="submit" className="w-full" disabled={loading || !email.trim()}>{loading ? 'Sending…' : 'Send reset link'}</Button>
        </form>
      )}
    </Shell>);
}
