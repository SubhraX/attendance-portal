import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import FacultyRecords from './FacultyRecords'; 
import { useTheme } from './ThemeContext';

export default function InstructorDashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('records'); 
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); 
  
  const [token, setToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrDuration, setQrDuration] = useState(120);
  const [isNetworkLocked, setIsNetworkLocked] = useState(false);
  const [classId, setClassId] = useState('CS101'); 
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [attendedStudents, setAttendedStudents] = useState([]);

  const socketRef = useRef(null);

  const startSession = async () => {
    if (!classId.trim()) return alert("Please enter a Target Class.");
    const authToken = localStorage.getItem('token');
    const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ classId: classId.trim(), qrDuration })
    });
    
    if(res.ok) {
      const data = await res.json();
      setToken(data.token); 
      setTimeLeft(qrDuration);
      setIsSessionActive(true);
      setAttendedStudents([]); 
      
      if (socketRef.current) socketRef.current.close();
      const socket = new WebSocket('wss://attendance-portal-p2lp.onrender.com');
      socketRef.current = socket;
      
      socket.onopen = () => socket.send(JSON.stringify({ action: 'startRotation', classId: classId.trim(), duration: qrDuration }));
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STUDENT_MARKED') setAttendedStudents(prev => [...prev, msg.student]);
      };
    } else {
      alert("Failed to start session. Check permissions.");
    }
  };

  const rotateQRToken = async () => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ classId: classId.trim(), qrDuration })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setTimeLeft(qrDuration); 
      }
    } catch (error) {}
  };

  const stopSession = async () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    const authToken = localStorage.getItem('token');
    await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ classId })
    });
    setIsSessionActive(false);
    setToken(null);
    setTimeLeft(0);
  };

  const toggleNetworkLock = async () => {
    const authToken = localStorage.getItem('token');
    const endpoint = isNetworkLocked ? '/unlock-network' : '/lock-network';
    try {
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({})
      });
      if (res.ok) setIsNetworkLocked(!isNetworkLocked);
      else alert("Failed to toggle network lock");
    } catch (error) {}
  };

  useEffect(() => {
    if (!isSessionActive) return;
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      rotateQRToken();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSessionActive]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const bgImage = isDarkMode ? "url('/BITS_Night.png')" : "url('/BITS.png')";
  const overlayClass = isDarkMode ? "bg-[#0b101a]/80 backdrop-blur-md" : "bg-[#fffaf0]/80 backdrop-blur-md";
  const glassPanel = isDarkMode ? "bg-[#161b26]/60 border-white/10" : "bg-white/60 border-orange-200/50";

  return (
    <div 
      className={`min-h-screen flex font-sans selection:bg-orange-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed relative text-gray-200`}
      style={{ backgroundImage: bgImage }}
    >
      <div className={`absolute inset-0 z-0 ${overlayClass}`}></div>
      
      <div className={`border-r flex flex-col p-6 shadow-2xl z-20 relative backdrop-blur-xl shrink-0 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-24 items-center'} ${isDarkMode ? 'bg-[#10141d]/80 border-white/10' : 'bg-white/80 border-orange-200/50'}`}>
        
        <div 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className={`flex items-center mb-10 pb-6 border-b cursor-pointer group w-full ${isSidebarExpanded ? 'gap-3' : 'justify-center'} ${isDarkMode ? 'border-white/10' : 'border-orange-200/50'}`}
          title="Toggle Sidebar"
        >
          <img 
            src="/BITS_logo.png" 
            alt="BIT Mesra" 
            className="w-12 h-12 object-contain drop-shadow-md bg-white/10 rounded-full p-1 shrink-0 group-hover:scale-110 transition-transform"
          />
          {isSidebarExpanded && (
            <div className="flex flex-col animate-fade-in-up">
              <h2 className={`text-lg font-extrabold tracking-wide uppercase leading-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>
                BIT Mesra
              </h2>
              <span className={`text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-orange-600'}`}>
                Faculty Panel
              </span>
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-4 w-full ${!isSidebarExpanded && 'items-center'}`}>
          <button 
            onClick={() => setActiveTab('generate')} 
            className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center border ${isSidebarExpanded ? 'px-4 gap-3' : 'w-12 justify-center'} ${activeTab === 'generate' ? 'bg-orange-600 border-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' : isDarkMode ? 'bg-black/20 border-orange-600/50 text-orange-500 hover:bg-orange-600/10' : 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'}`}
            title="Generate QR"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">Generate QR</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('records')} 
            className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center border ${isSidebarExpanded ? 'px-4 gap-3' : 'w-12 justify-center'} ${activeTab === 'records' ? 'bg-orange-600 border-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' : isDarkMode ? 'bg-black/20 border-orange-600/50 text-orange-500 hover:bg-orange-600/10' : 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'}`}
            title="Student Records"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">Student Records</span>}
          </button>
        </div>

        <div className={`mt-auto pt-6 border-t w-full flex ${!isSidebarExpanded && 'justify-center'} ${isDarkMode ? 'border-white/10' : 'border-orange-200/50'}`}>
          <button
            onClick={toggleTheme}
            className={`py-3 rounded-xl font-semibold transition-all duration-300 flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full justify-center' : 'w-12 justify-center'} ${isDarkMode ? 'bg-black/20 border-white/10 text-gray-300 hover:bg-white/5' : 'bg-white/50 border-orange-200 text-orange-900 hover:bg-orange-50'}`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? (
              <>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">Light Mode</span>}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">Dark Mode</span>}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area with Log Out Button */}
      <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto z-10 relative transition-all duration-300">
        
        {/* LOG OUT BUTTON (Upper Right) */}
        <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border shadow-sm active:scale-95 ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Log out
          </button>
        </div>

        <div className="w-full max-w-[1400px] mx-auto flex flex-col h-full mt-10 md:mt-4">
          
          {activeTab === 'generate' ? (
            <div className={`w-full mx-auto flex flex-col lg:flex-row gap-8 ${isSessionActive ? 'items-stretch' : 'items-center justify-center h-full'}`}>
              
              <div className={`flex-1 flex flex-col ${!isSessionActive ? 'max-w-md w-full' : 'items-center justify-center'}`}>
                {!isSessionActive ? (
                  <div className={`flex flex-col p-8 rounded-3xl border shadow-2xl backdrop-blur-xl animate-fade-in-up w-full gap-6 ${glassPanel}`}>
                    <h2 className={`text-2xl font-bold tracking-wide border-b pb-4 ${isDarkMode ? 'text-white border-white/10' : 'text-orange-950 border-orange-200/50'}`}>Generate QR Session</h2>
                    
                    <div className="flex flex-col gap-2">
                      <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Target Class</label>
                      <input 
                        type="text" 
                        value={classId} 
                        onChange={(e) => setClassId(e.target.value.toUpperCase())} 
                        className={`rounded-xl font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 px-4 py-3 transition-colors w-full border ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-orange-200/50 text-orange-950'}`} 
                        placeholder="E.g. CS101"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>QR Refresh (Seconds)</label>
                      <input 
                        type="number" 
                        min="5" 
                        max="300" 
                        value={qrDuration} 
                        onChange={(e) => setQrDuration(Number(e.target.value))} 
                        className={`rounded-xl font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 px-4 py-3 transition-colors w-full border ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-orange-200/50 text-orange-950'}`} 
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Security</label>
                      <div 
                        onClick={toggleNetworkLock}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-colors w-full group border ${isDarkMode ? 'bg-black/40 border-white/10 hover:border-orange-500/50' : 'bg-white/60 border-orange-200/50 hover:border-orange-400'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{isNetworkLocked ? '🔒' : '🔓'}</span>
                          <span className={`text-sm font-medium transition-colors ${isNetworkLocked ? 'text-emerald-400' : isDarkMode ? 'text-gray-300' : 'text-orange-900'}`}>
                            {isNetworkLocked ? 'Locked to Campus Wi-Fi' : 'Unlocked'}
                          </span>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isNetworkLocked ? 'bg-emerald-500' : isDarkMode ? 'bg-gray-600' : 'bg-orange-300'}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isNetworkLocked ? 'translate-x-4' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={startSession} 
                      className="mt-4 bg-orange-600 hover:bg-orange-500 text-white px-6 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all w-full active:scale-95 text-lg"
                    >
                      Start Live Session
                    </button>
                  </div>
                ) : (
                  <div className={`text-center p-10 md:p-14 rounded-3xl shadow-2xl backdrop-blur-xl w-full max-w-2xl transform transition-all animate-fade-in-up flex flex-col items-center border ${glassPanel}`}>
                    <div className={`px-6 py-2 rounded-full border mb-8 inline-flex items-center gap-3 ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-orange-200/50'}`}>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className={`font-mono tracking-wider font-semibold ${isDarkMode ? 'text-gray-200' : 'text-orange-950'}`}>CLASS: {classId}</span>
                    </div>
                    
                    {token ? (
                      <>
                        <div className="flex justify-center p-6 md:p-8 bg-white rounded-2xl shadow-xl w-full max-w-[400px]">
                           <QRCode 
                             value={JSON.stringify({ classId, token })} 
                             size={320} 
                             style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                           />
                        </div>
                        <p className={`font-mono font-extrabold mt-10 text-5xl md:text-6xl tracking-widest drop-shadow-[0_0_15px_rgba(234,88,12,0.5)] text-orange-500`}>
                          {formatTime(timeLeft)}
                        </p>
                      </>
                    ) : (
                      <div className={`h-[400px] flex items-center justify-center font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-orange-900/50'}`}>
                        Generating secure token...
                      </div>
                    )}

                    <button 
                      onClick={stopSession} 
                      className="mt-12 px-8 py-3 rounded-xl font-bold transition-all w-full max-w-xs border bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white"
                    >
                      Stop Live Session
                    </button>
                  </div>
                )}
              </div>

              {isSessionActive && (
                <div className={`w-full lg:w-80 border rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl animate-fade-in-up ${glassPanel}`}>
                  <div className={`border-b px-6 py-5 flex items-center justify-between ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/40 border-orange-200/50'}`}>
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Live Attendance</h3>
                    <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{attendedStudents.length}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-transparent">
                    {attendedStudents.length === 0 ? (
                      <div className={`h-full flex flex-col items-center justify-center space-y-3 p-6 text-center ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50 font-medium'}`}>
                        <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                        <p className="text-sm">Waiting for scans...</p>
                      </div>
                    ) : (
                      attendedStudents.map((student, index) => (
                        <div key={index} className={`border rounded-xl p-3 flex items-center gap-3 animate-fade-in-up ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/60 border-orange-200/50'}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-500/20 text-emerald-400">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{student.name}</p>
                            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>{student.email}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <FacultyRecords />
          )}
        </div>
      </div>
    </div>
  );
}