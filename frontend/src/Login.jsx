import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = window.crypto?.randomUUID 
        ? window.crypto.randomUUID() 
        : `device-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      localStorage.setItem('deviceId', deviceId);
    }

    try {
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceId })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.user.role !== role) {
          setStatus(`Error: This account belongs to a ${data.user.role}.`);
          setIsLoading(false);
          return;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);

        if (data.user.role === 'instructor') navigate('/instructor');
        else navigate('/student');
      } else {
        setStatus(`Error: ${data.message}`);
        setIsLoading(false);
      }
    } catch (error) {
      setStatus('Error: Unable to connect to the server.');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/BITS.png')` }}
    >
      {/* Very light dark overlay to maintain text contrast */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Main Glass Container - Increased transparency (lowered opacity from 85 to 60) */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md bg-[#fffaf0]/60 border border-orange-100/50">
        
        {/* Left Side - Vision & Mission Panel */}
        <div className="w-full lg:w-[55%] p-8 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-orange-200/50">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-orange-950 mb-2 drop-shadow-sm uppercase tracking-wide">
            Birla Institute of Technology, Mesra
          </h1>
          <h2 className="text-xl font-bold text-orange-700 mb-8">University ERP System</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-bold text-orange-900 mb-2 border-b border-orange-300 pb-1 inline-block">Institute Vision</h3>
            <p className="text-orange-950/90 text-sm font-medium leading-relaxed">
              To become a globally recognized academic institution in consonance with the social, economic and ecological environment, striving continuously for excellence in education, research and technological service to the national needs.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-orange-900 mb-2 border-b border-orange-300 pb-1 inline-block">Institute Mission</h3>
            <ul className="list-decimal list-inside text-orange-950/90 text-sm font-medium leading-relaxed space-y-1">
              <li>To educate students at Undergraduate, Post Graduate, Doctoral, and Post Doctoral levels to perform challenging engineering and managerial jobs in industry.</li>
              <li>To provide excellent research and development facilities to take up Ph.D. programmes and research projects.</li>
              <li>To develop effective teaching and learning skills and state-of-the-art research potential of the faculty.</li>
            </ul>
          </div>
        </div>

        {/* Right Side - Interactive Login/Role Selection (lowered from white/40 to white/10) */}
        <div className="w-full lg:w-[45%] p-8 lg:p-12 flex flex-col justify-center bg-white/10">
          
          {!role ? (
            <div className="animate-fade-in-up w-full">
              <h2 className="text-2xl font-bold text-orange-950 mb-6 text-center">Welcome! Please login to continue.</h2>
              <div className="flex flex-col gap-4">
                <button onClick={() => setRole('instructor')} className="group relative bg-[#fffdfa]/80 border border-orange-200/60 p-6 rounded-xl hover:border-orange-500 hover:bg-orange-50/90 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-300 text-left overflow-hidden">
                  <h2 className="text-xl font-bold text-orange-900 mb-1 group-hover:text-orange-700">Faculty Portal</h2>
                  <p className="text-orange-900/80 text-sm font-medium">Manage sessions and project QR codes.</p>
                </button>
                <button onClick={() => setRole('student')} className="group relative bg-[#fffdfa]/80 border border-orange-200/60 p-6 rounded-xl hover:border-orange-500 hover:bg-orange-50/90 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-300 text-left overflow-hidden">
                  <h2 className="text-xl font-bold text-orange-900 mb-1 group-hover:text-orange-700">Student Portal</h2>
                  <p className="text-orange-900/80 text-sm font-medium">Scan active sessions and register attendance.</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up w-full max-w-sm mx-auto">
              <button onClick={() => { setRole(null); setStatus(''); }} className="text-orange-800 hover:text-orange-950 mb-6 transition-colors font-bold text-sm flex items-center gap-1">
                &larr; Back to roles
              </button>
              <h2 className="text-3xl font-bold text-orange-950 mb-6 text-center">
                {role === 'instructor' ? 'Faculty Login' : 'Student Login'}
              </h2>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input 
                  type="email" 
                  placeholder="Enter email address" 
                  className="bg-white/90 border border-orange-200/80 text-orange-950 rounded-lg p-3.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium placeholder-orange-950/50" 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
                <input 
                  type="password" 
                  placeholder="Enter password" 
                  className="bg-white/90 border border-orange-200/80 text-orange-950 rounded-lg p-3.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium placeholder-orange-950/50" 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                
                <div className="text-right mb-2">
                  <a href="#" className="text-xs font-bold text-orange-800 hover:text-orange-950 transition-colors drop-shadow-sm">Forgot password?</a>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`flex justify-center items-center text-white font-bold py-3.5 rounded-lg transition-all shadow-md bg-orange-600 hover:bg-orange-500 hover:shadow-orange-500/30 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
              {status && <div className="mt-4 p-3 bg-red-100/90 border border-red-300 text-red-800 rounded-lg text-sm text-center font-bold">{status}</div>}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}