import { useState } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { STREAMS } from './FacultyRecords';

export default function RegisterStudentModal({ onClose, onSuccess }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', stream: STREAMS[0] });

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

  const inputClass = `w-full border px-3 py-1.5 text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-sm rounded-sm shadow-md flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-300'}`}>
        
        <div className={`flex justify-between items-center px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Register New Student</h3>
          <button onClick={onClose} className={`text-xl leading-none ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>&times;</button>
        </div>
        
        <form onSubmit={handleRegisterStudent} className="flex flex-col gap-3 p-4">
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</label>
            <input type="text" required value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className={inputClass} />
          </div>
          
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email Address</label>
            <input type="email" required value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className={inputClass} />
          </div>
          
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stream</label>
            <select value={regForm.stream} onChange={e => setRegForm({ ...regForm, stream: e.target.value })} className={inputClass}>
              {STREAMS.map(stream => (
                <option key={stream} value={stream}>{stream}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Password</label>
            <input type="password" required value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className={inputClass} />
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className={`px-4 py-1.5 text-sm rounded-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-sm">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}