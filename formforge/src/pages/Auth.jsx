import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Logo } from '../components/AppLayout';
import { Button, Input } from '../components/ui';
import { useAppDispatch, useAppSelector, login, signup } from '../store';
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
export const ForgotPassword = () => (<Shell title="Reset your password" subtitle="Password reset by email isn't set up yet." footer={<Link to="/login" className="font-medium text-accent-600">Back to log in</Link>}>
    <p className="text-sm text-neutral-600">This needs an email service connected to the backend. Until then, create a new account or contact the workspace owner.</p>
  </Shell>);
