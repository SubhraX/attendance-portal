import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import Login from './Login';
import InstructorDashboard from './InstructorDashboard';
import StudentDashboard from './StudentDashboard';
import StudentScanner from './StudentScanner';

// 1. Dynamic Portal Route: Sorts Faculty and Students dynamically
const ProtectedPortal = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" replace />;
  if (user.role === 'instructor') return <InstructorDashboard />;
  
  return <StudentDashboard />;
};

// 2. Protected Scanner Route: Only logged-in users can access
const ProtectedScanner = () => {
  const token = localStorage.getItem('token');
  
  if (!token) return <Navigate to="/login" replace />;
  
  return <StudentScanner />;
};

// 3. Public Login Route: Redirects to dashboard if already logged in
const PublicLogin = () => {
  const token = localStorage.getItem('token');
  
  if (token) return <Navigate to="/" replace />;
  
  return <Login />;
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicLogin />} />
            
            {/* The base path now triggers our dynamic sorting wrapper */}
            <Route path="/" element={<ProtectedPortal />} />
            
            <Route path="/scanner" element={<ProtectedScanner />} />
            
            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}