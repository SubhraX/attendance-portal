import { useState } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';

export default function RegisterStudentModal({ onClose, onSuccess }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });

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
      showToast("Error connecting to server");
    }
  };

  const glassInput = `w-full rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors border ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-orange-200 text-orange-950 font-medium focus:ring-2 focus:ring-orange-500/20 placeholder-orange-900/40'}`;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in-up ${isDarkMode ? 'bg-black/60' : 'bg-black/20'}`}>
      <div className={`border rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative backdrop-blur-3xl ${isDarkMode ? 'bg-[#191e28]/95 border-white/10' : 'bg-white/95 border-orange-200'}`}>
        
        <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white bg-black/20' : 'text-orange-400 hover:text-orange-600 bg-orange-50'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <h3 className={`text-2xl font-bold mb-6 tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Register Student</h3>
        
        <form onSubmit={handleRegisterStudent} className="flex flex-col gap-4">
          <input type="text" placeholder="Full Name" required value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className={glassInput} />
          <input type="email" placeholder="Email Address" required value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className={glassInput} />
          <input type="password" placeholder="Password" required value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className={glassInput} />
          
          <button type="submit" className="mt-4 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-full transition-all shadow-[0_0_15px_rgba(234,88,12,0.4)] active:scale-95">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}