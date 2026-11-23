import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ToastProvider } from './ToastContext';
import Login from './Login';
import InstructorDashboard from './InstructorDashboard';
import StudentDashboard from './StudentDashboard';
import StudentScanner from './StudentScanner';

// Edit your team members here
const TEAM_MEMBERS = [
  { name: 'Member One', role: 'Lead Developer' },
  { name: 'Member Two', role: 'Frontend Developer' },
  { name: 'Member Three', role: 'Backend Developer' },
  { name: 'Member Four', role: 'UI/UX Designer' },
];

// Clickable Watermark + Team Modal (hidden on /login)
const Watermark = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [showModal, setShowModal] = useState(false);

  if (location.pathname === '/login') return null;

  return (
    <>
      <div className="hidden md:block absolute bottom-6 right-5 z-40 select-none text-xs font-bold uppercase tracking-widest text-gray-500/70">
        Made by{' '}
        <button
          onClick={() => setShowModal(true)}
          className="text-orange-500/80 hover:text-orange-400 hover:underline cursor-pointer transition-colors"
        >
          GROUP 8
        </button>
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode
              ? 'bg-[#121826] border-gray-800 text-gray-100'
              : 'bg-white border-gray-200 text-gray-900'
              }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}
            >
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-orange-500 font-bold">
                  Development Team
                </p>
                <h3 className="text-base font-extrabold uppercase tracking-wider">
                  GROUP 8
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`p-1.5 rounded-md transition-colors ${isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Team List */}
            <div className="p-5 flex flex-col gap-2.5">
              {TEAM_MEMBERS.map((member, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border ${isDarkMode
                    ? 'bg-[#1e293b]/60 border-gray-800'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <span className="text-sm font-bold">{member.name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isDarkMode
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
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
          <div className="relative min-h-screen">
            <Routes>
              <Route path="/login" element={<PublicLogin />} />
              <Route path="/" element={<ProtectedPortal />} />
              <Route path="/scanner" element={<ProtectedScanner />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Watermark />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}