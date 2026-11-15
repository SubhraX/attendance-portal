import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import Login from './Login';
import InstructorDashboard from './InstructorDashboard';
import StudentDashboard from './StudentDashboard';
import StudentScanner from './StudentScanner';

export default function App() {
  // Check if a user is logged in
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route 
              path="/login" 
              element={!token ? <Login /> : <Navigate to="/" />} 
            />
            
            {/* Main Portal Route (Decides which dashboard to show) */}
            <Route 
              path="/" 
              element={
                !token ? <Navigate to="/login" /> :
                user.role === 'instructor' ? <InstructorDashboard /> :
                <StudentDashboard /> // This makes the portal open first!
              } 
            />

            {/* Dedicated Scanner Route (Opened via the Dashboard button) */}
            <Route 
              path="/scanner" 
              element={
                !token ? <Navigate to="/login" /> : 
                <StudentScanner />
              } 
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}