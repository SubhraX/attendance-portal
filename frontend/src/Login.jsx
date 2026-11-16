import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);
  
  const [role, setRole] = useState('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "ERP Login - BIT Mesra";
    
    const fadeTimer = setTimeout(() => setIsFading(true), 1200);
    const removeTimer = setTimeout(() => setShowSplash(false), 1700);
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

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
          setStatus(`Error: Account belongs to a ${data.user.role}.`);
          return;
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setStatus(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      setStatus('Error: Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showSplash && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <img src="/BITS_logo.png" alt="BITS Mesra Logo" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="mt-6 text-gray-800 font-bold tracking-widest uppercase text-xs animate-pulse">Initializing ERP</h2>
        </div>
      )}

      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat font-sans"
        style={{ backgroundImage: `url('/BITS.png')` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-xl border border-white/50">
          
          {/* Left Side - Info */}
          <div className="w-full md:w-5/12 p-6 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200/50 bg-gray-50/50">
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
              <img src="/BITS_logo.png" alt="BITS Mesra" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-sm" />
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1 uppercase tracking-tight">
                  BIT Mesra
                </h1>
                <h2 className="text-xs md:text-sm font-bold text-orange-600 uppercase tracking-wider">University ERP System</h2>
              </div>
            </div>
            
            {/* HIDE TEXT ON MOBILE TO PREVENT SCROLLING */}
            <div className="hidden md:block mt-8">
              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">Institute Vision</h3>
              <p className="text-gray-600 text-xs font-medium leading-relaxed mb-6">
                To become a globally recognized academic institution in consonance with the social, economic and ecological environment, striving continuously for excellence in education, research and technological service to the national needs.
              </p>

              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide border-b border-gray-200 pb-1">Institute Mission</h3>
              <ul className="list-decimal list-inside text-gray-600 text-xs font-medium leading-relaxed space-y-1">
                <li>Educate students at UG, PG, and Doctoral levels.</li>
                <li>Provide excellent research facilities.</li>
                <li>Develop effective teaching skills.</li>
              </ul>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-7/12 p-6 md:p-12 flex flex-col justify-center bg-white/60">
            
            <div className="w-full max-w-sm mx-auto">
              
              {/* Role Switch - Compact and flat */}
              <div className="flex w-full p-1 bg-gray-200/50 rounded-lg mb-8 border border-gray-300/50">
                <button
                  type="button"
                  onClick={() => { setRole('student'); setStatus(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
                    role === 'student' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Student Portal
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('instructor'); setStatus(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
                    role === 'instructor' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Faculty Portal
                </button>
              </div>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Credentials</label>
                  <input 
                    type="text" 
                    placeholder="Enrollment Number / Email" 
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-sm" 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-sm" 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`mt-2 flex justify-center items-center gap-2 text-white font-semibold py-2.5 rounded-lg transition-colors bg-orange-600 hover:bg-orange-700 active:scale-95 text-sm ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
              
              {status && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs text-center font-semibold">
                  {status}
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* Copyright Stamp */}
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-50 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/90 m-0">
              &copy; {new Date().getFullYear()} BIT Mesra
            </p>
          </div>
        </div>
      </div>
    </>
  );
}