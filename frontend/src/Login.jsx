import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('Authenticating...');

    const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }) // Keep your existing body variables
    });
    const data = await res.json();

    if (res.ok) {
      if (data.user.role !== role) {
        setStatus(`Error: This account belongs to a ${data.user.role}.`);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);

      if (data.user.role === 'instructor') navigate('/instructor');
      else navigate('/student');
    } else {
      setStatus(`Error: ${data.message}`);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-3xl w-full text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">University ERP</h1>
          <p className="text-slate-400 text-lg">Secure Attendance Management System</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl animate-fade-in-up">
          <button onClick={() => setRole('instructor')} className="group relative bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 text-left overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400">Faculty Portal</h2>
              <p className="text-slate-400">Manage sessions and project QR codes.</p>
            </div>
          </button>
          <button onClick={() => setRole('student')} className="group relative bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 text-left overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400">Student Portal</h2>
              <p className="text-slate-400">Scan active sessions and register attendance.</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-fade-in-up">
        <button onClick={() => setRole(null)} className="text-slate-500 hover:text-white mb-6">&larr; Back to roles</button>
        <h2 className="text-3xl font-bold text-white mb-2">{role === 'instructor' ? 'Faculty Login' : 'Student Login'}</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-5 mt-6">
          <input type="email" placeholder="Email Address" className="bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="bg-slate-950 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500" onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className={`text-white font-bold py-3 rounded-lg ${role === 'instructor' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>Sign In</button>
        </form>
        {status && <div className="mt-6 p-3 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm text-center">{status}</div>}
      </div>
    </div>
  );
}