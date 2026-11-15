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
          setStatus(`Error: This account belongs to a ${data.user.role}.`);
          setIsLoading(false);
          return;
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        navigate('/');
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
    <>
      {showSplash && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-40 h-40 border-[4px] border-orange-100 border-t-orange-600 border-b-orange-600 rounded-full animate-spin"></div>
            <img 
              src="/BITS_logo.png" 
              alt="BITS Mesra Logo" 
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="mt-10 text-orange-950 font-bold tracking-widest uppercase text-sm animate-pulse">Initializing ERP</h2>
        </div>
      )}

      <div 
        className="min-h-screen flex items-center justify-center p-4 md:p-8 relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/BITS.png')` }}
      >
        {/* Subtle dark overlay to make the pure white light-mode glass pop */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Semi-transparent Frosted Glass Container */}
        <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-lg bg-white/40 border border-white/60">
          
          {/* Left Side */}
          <div className="w-full lg:w-[50%] p-8 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/50 bg-white/20">
            <div className="flex flex-col xl:flex-row items-center xl:items-start gap-5 mb-10 text-center xl:text-left">
              <img 
                src="/BITS_logo.png" 
                alt="BITS Mesra Logo" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0 drop-shadow-sm"
              />
              <div className="flex flex-col justify-center pt-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-950 mb-1 uppercase tracking-tight leading-tight drop-shadow-sm">
                  Birla Institute of <span className="inline-block whitespace-nowrap">Technology, Mesra</span>
                </h1>
                <h2 className="text-sm sm:text-base font-bold text-orange-700 uppercase tracking-wider">University ERP System</h2>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-bold text-orange-950 mb-2 uppercase tracking-wide border-b border-orange-950/20 pb-1 inline-block">Institute Vision</h3>
              <p className="text-orange-950/80 text-sm font-medium leading-relaxed font-semibold">
                To become a globally recognized academic institution in consonance with the social, economic and ecological environment, striving continuously for excellence in education, research and technological service to the national needs.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-orange-950 mb-2 uppercase tracking-wide border-b border-orange-950/20 pb-1 inline-block">Institute Mission</h3>
              <ul className="list-decimal list-inside text-orange-950/80 text-sm font-medium leading-relaxed space-y-1 font-semibold">
                <li>To educate students at Undergraduate, Post Graduate, Doctoral, and Post Doctoral levels to perform challenging engineering and managerial jobs.</li>
                <li>To provide excellent research and development facilities.</li>
                <li>To develop effective teaching and learning skills.</li>
              </ul>
            </div>
          </div>

          {/* Right Side - Interactive Portal */}
          <div className="w-full lg:w-[50%] p-8 lg:p-14 flex flex-col justify-center bg-white/30">
            
            <div className="w-full max-w-[360px] mx-auto animate-fade-in-up">
              
              {/* Role Toggle Switch */}
              <div className="flex w-full p-1 bg-white/60 border border-white/50 backdrop-blur-md rounded-full mb-10 shadow-sm">
                <button
                  type="button"
                  onClick={() => { setRole('student'); setStatus(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    role === 'student' 
                      ? 'bg-orange-600 text-white shadow-[0_2px_10px_rgba(234,88,12,0.3)]' 
                      : 'bg-transparent text-orange-950/70 hover:text-orange-950 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                  Student Login
                </button>
                
                <button
                  type="button"
                  onClick={() => { setRole('instructor'); setStatus(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                    role === 'instructor' 
                      ? 'bg-orange-600 text-white shadow-[0_2px_10px_rgba(234,88,12,0.3)]' 
                      : 'bg-transparent text-orange-950/70 hover:text-orange-950 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Faculty Login
                </button>
              </div>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                
                {/* Email Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h4" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enrollment Number / Email" 
                    className="w-full bg-white/70 backdrop-blur-sm border border-white text-orange-950 rounded-xl py-3.5 pl-14 pr-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-bold placeholder-gray-500 text-sm shadow-sm" 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                
                {/* Password Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    className="w-full bg-white/70 backdrop-blur-sm border border-white text-orange-950 rounded-xl py-3.5 pl-14 pr-12 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-bold placeholder-gray-500 text-sm shadow-sm" 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`mt-4 flex justify-center items-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_5px_15px_rgba(234,88,12,0.3)] bg-orange-600 hover:bg-orange-500 active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
              
              {status && (
                <div className="mt-5 p-3 bg-red-50/90 backdrop-blur-md border border-red-200 text-red-600 rounded-xl text-sm text-center font-bold shadow-sm">
                  {status}
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}