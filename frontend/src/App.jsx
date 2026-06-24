import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Query      from './pages/Query';
import ForgetChat from './pages/ForgetChat';
import DeleteUser from './pages/DeleteUser';
import Audit      from './pages/Audit';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Landing />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/query"        element={<ProtectedRoute><Query /></ProtectedRoute>} />
        <Route path="/forget-chat"  element={<ProtectedRoute><ForgetChat /></ProtectedRoute>} />
        <Route path="/delete-user"  element={<ProtectedRoute><DeleteUser /></ProtectedRoute>} />
        <Route path="/audit"        element={<ProtectedRoute><Audit /></ProtectedRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
