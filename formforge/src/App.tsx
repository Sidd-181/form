import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import RequireAuth from './components/RequireAuth'
import Dashboard from './pages/Dashboard'
import CreateForm from './pages/CreateForm'
import Editor from './pages/Editor'
import { Login, Signup, ForgotPassword } from './pages/Auth'
import Preview from './pages/Preview'
import Share from './pages/Share'
import Responses from './pages/Responses'
import Analytics from './pages/Analytics'
import PublicForm from './pages/PublicForm'
import Landing from './pages/Landing'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/forms/:formId" element={<PublicForm />} />
      <Route element={<RequireAuth><Outlet /></RequireAuth>}>
        <Route path="/app/forms/:id/edit" element={<Editor />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="forms/new" element={<CreateForm />} />
          <Route path="forms/:id/preview" element={<Preview />} />
          <Route path="forms/:id/share" element={<Share />} />
          <Route path="forms/:id/responses" element={<Responses />} />
          <Route path="forms/:id/analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
