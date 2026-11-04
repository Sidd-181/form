import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AppLayout from './components/AppLayout.js';
import RequireAuth from './components/RequireAuth.js';
import Dashboard from './pages/Dashboard.js';
import CreateForm from './pages/CreateForm.js';
import Editor from './pages/Editor.jsx';
import { Login, Signup, ForgotPassword } from './pages/Auth.js';
import Preview from './pages/Preview.js';
import Share from './pages/Share.jsx';
import Responses from './pages/Responses.jsx';
import Analytics from './pages/Analytics.js';
import PublicForm from './pages/PublicForm.jsx';
import Landing from './pages/Landing.js';
import Settings from './pages/Settings.jsx';
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/signup", element: _jsx(Signup, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "/forms/:formId", element: _jsx(PublicForm, {}) }), _jsxs(Route, { element: _jsx(RequireAuth, { children: _jsx(Outlet, {}) }), children: [_jsx(Route, { path: "/app/forms/:id/edit", element: _jsx(Editor, {}) }), _jsxs(Route, { path: "/app", element: _jsx(AppLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "forms/new", element: _jsx(CreateForm, {}) }), _jsx(Route, { path: "forms/:id/preview", element: _jsx(Preview, {}) }), _jsx(Route, { path: "forms/:id/share", element: _jsx(Share, {}) }), _jsx(Route, { path: "forms/:id/responses", element: _jsx(Responses, {}) }), _jsx(Route, { path: "forms/:id/analytics", element: _jsx(Analytics, {}) }), _jsx(Route, { path: "settings", element: _jsx(Settings, {}) })] })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/app", replace: true }) })] }));
}
