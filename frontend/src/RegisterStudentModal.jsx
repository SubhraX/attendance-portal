import { useState } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { STREAMS } from './FacultyRecords';

export default function RegisterStudentModal({ onClose, onSuccess }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', stream: STREAMS[0] });
  const [showPassword, setShowPassword] = useState(false);

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regForm, role: 'student' })
      });
      if (res.ok) {
        showToast("Student registered successfully!");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToast("Error connecting to server");
    }
  };

  const inputClass = `w-full border px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
    isDarkMode 
      ? 'bg-[#0f172a] border-gray-700 text-gray-100 placeholder-gray-600' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;
  
  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
    isDarkMode ? 'text-gray-400' : 'text-gray-500'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden ${
        isDarkMode ? 'bg-[#1e293b] border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        
        <div className={`flex justify-between items-center px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h3 className={`text-base font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Register New Student
          </h3>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-md transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleRegisterStudent} className="flex flex-col gap-5 p-6">
          <div>
            <label className={labelClass}>Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe" 
              required 
              value={regForm.name} 
              onChange={e => setRegForm({ ...regForm, name: e.target.value })} 
              className={inputClass} 
            />
          </div>
          
          <div>
            <label className={labelClass}>Email Address</label>
            <input 
              type="email" 
              placeholder="student@bitmesra.ac.in" 
              required 
              value={regForm.email} 
              onChange={e => setRegForm({ ...regForm, email: e.target.value })} 
              className={inputClass} 
            />
          </div>
          
          <div>
            <label className={labelClass}>Stream</label>
            <select 
              value={regForm.stream} 
              onChange={e => setRegForm({ ...regForm, stream: e.target.value })} 
              className={inputClass}
            >
              {STREAMS.map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={regForm.password} 
                onChange={e => setRegForm({ ...regForm, password: e.target.value })} 
                className={`${inputClass} pr-10`} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                  isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                isDarkMode ? 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}