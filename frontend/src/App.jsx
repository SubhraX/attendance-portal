import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import Login from './Login';
import InstructorDashboard from './InstructorDashboard';
import StudentDashboard from './StudentDashboard';
import StudentScanner from './StudentScanner';

// Watermark component that hides on the login page
const Watermark = () => {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  return (
    <div className="fixed bottom-3 right-4 z-40 pointer-events-none select-none text-[10px] font-bold uppercase tracking-widest text-gray-500/70">
      Made by <span className="text-orange-500/80">Xdevs</span>
    </div>
  );
};

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
          <Watermark />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}