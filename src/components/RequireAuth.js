import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { restoreSession, useAppDispatch, useAppSelector } from '../store/index.js';
export default function RequireAuth({ children }) {
    const status = useAppSelector(s => s.auth.status);
    const dispatch = useAppDispatch();
    const loc = useLocation();
    useEffect(() => { if (status === 'checking')
        dispatch(restoreSession()); }, [status, dispatch]);
    if (status === 'checking')
        return _jsx("div", { className: "grid min-h-screen place-items-center text-neutral-500", children: _jsx(Loader2, { className: "animate-spin" }) });
    if (status === 'anon')
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: loc.pathname } });
    return _jsx(_Fragment, { children: children });
}
