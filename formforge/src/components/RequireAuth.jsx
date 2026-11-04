import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { restoreSession, useAppDispatch, useAppSelector } from '../store';
export default function RequireAuth({ children }) {
    const status = useAppSelector(s => s.auth.status);
    const dispatch = useAppDispatch();
    const loc = useLocation();
    useEffect(() => { if (status === 'checking')
        dispatch(restoreSession()); }, [status, dispatch]);
    if (status === 'checking')
        return <div className="grid min-h-screen place-items-center text-neutral-500"><Loader2 className="animate-spin"/></div>;
    if (status === 'anon')
        return <Navigate to="/login" replace state={{ from: loc.pathname }}/>;
    return <>{children}</>;
}
