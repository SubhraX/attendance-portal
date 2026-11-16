import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import FacultyRecords from './FacultyRecords'; 
import { useTheme } from './ThemeContext';

export default function InstructorDashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('generate'); 
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
    if (!classId.trim()) {
      console.warn("Course Code is required.");
      return;
    }

    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ classId: classId.trim(), qrDuration })
      });
      
      if (res.ok) {
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
        console.error("Failed to initialize session.");
      }
    } catch (error) {
      console.error("Session start error:", error);
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
    } catch (error) {
      console.error("Token rotation error:", error);
    }
  };

  const stopSession = async () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    const authToken = localStorage.getItem('token');
    try {
      await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ classId })
      });
    } catch (error) {
      console.error("Error stopping session:", error);
    }
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
      if (res.ok) {
        setIsNetworkLocked(!isNetworkLocked);
      } else {
        console.error("Network toggle failed");
      }
    } catch (error) {
      console.error("Network toggle error:", error);
    }
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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const bgImage = isDarkMode ? "url('/BITS_Night.png')" : "url('/BITS.png')";
  const overlayClass = isDarkMode ? "bg-[#0b101a]/90 backdrop-blur-sm" : "bg-[#fffaf0]/90 backdrop-blur-sm";
  const panelClass = isDarkMode ? "bg-[#161b26] border-gray-800" : "bg-white border-gray-200";
  const inputClass = isDarkMode ? "bg-[#0b101a] border-gray-800 text-gray-200" : "bg-gray-50 border-gray-300 text-gray-900";

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-orange-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed relative text-gray-200"
      style={{ backgroundImage: bgImage }}
    >
      <div className={`absolute inset-0 z-0 ${overlayClass}`}></div>
      
      <div className={`md:border-r border-b flex flex-row md:flex-col p-4 md:p-6 z-20 relative shrink-0 w-full md:w-auto ${isSidebarExpanded ? 'md:w-64' : 'md:w-24 md:items-center'} justify-between md:justify-start ${isDarkMode ? 'bg-[#10141d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div 
          onClick={() => { if (window.innerWidth >= 768) setIsSidebarExpanded(!isSidebarExpanded) }}
          className={`flex items-center md:mb-10 md:pb-6 md:border-b cursor-pointer shrink-0 ${isSidebarExpanded ? 'gap-3' : 'gap-3 md:justify-center w-full'} ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}
          title="Toggle Sidebar"
        >
          <img 
            src="/BITS_logo.png" 
            alt="BIT Mesra" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white/10 rounded-full p-1 shrink-0"
          />
          <div className={`flex-col ${!isSidebarExpanded ? 'flex md:hidden' : 'flex'}`}>
            <h2 className={`text-lg font-bold tracking-wide uppercase leading-tight whitespace-nowrap ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              BIT Mesra
            </h2>
            <span className={`text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${isDarkMode ? 'text-orange-500' : 'text-orange-700'}`}>
              Faculty Portal
            </span>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleTheme} className={`p-2.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
            {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
          <button onClick={handleLogout} className={`p-2.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-red-500' : 'bg-white border-gray-300 text-red-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>

        <div className={`hidden md:flex flex-col gap-2 w-full ${!isSidebarExpanded && 'items-center'}`}>
          <button onClick={() => setActiveTab('generate')} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'generate' ? 'bg-orange-600 border-orange-600 text-white' : isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">Generate QR</span>}
          </button>
          
          <button onClick={() => setActiveTab('records')} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'records' ? 'bg-orange-600 border-orange-600 text-white' : isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">Student Records</span>}
          </button>
        </div>

        <div className={`hidden md:flex mt-auto pt-6 border-t flex-col gap-2 w-full ${!isSidebarExpanded && 'items-center'} ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
          <button onClick={toggleTheme} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            {isDarkMode ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            {isSidebarExpanded && <span className="whitespace-nowrap">Theme</span>}
          </button>
          
          <button onClick={handleLogout} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${isDarkMode ? 'bg-transparent border-transparent text-red-500 hover:bg-gray-800' : 'bg-transparent border-transparent text-red-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">Log Out</span>}
          </button>

          {isSidebarExpanded && (
            <div className={`mt-2 text-[10px] text-center font-mono ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              &copy; {new Date().getFullYear()} BIT Mesra
            </div>
          )}
        </div>
      </div>

      <div className={`md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center p-1 rounded-xl border z-50 ${isDarkMode ? 'bg-[#10141d] border-gray-800' : 'bg-white border-gray-300'}`}>
        <button onClick={() => setActiveTab('generate')} className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'generate' ? 'bg-orange-600 text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          <span className={activeTab === 'generate' ? 'block' : 'hidden sm:block'}>QR Code</span>
        </button>
        <button onClick={() => setActiveTab('records')} className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'records' ? 'bg-orange-600 text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span className={activeTab === 'records' ? 'block' : 'hidden sm:block'}>Directory</span>
        </button>
      </div>

      <div className="flex-1 p-4 pb-28 md:p-10 flex flex-col overflow-y-auto z-10 relative">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col h-full mt-2 md:mt-4">
          
          {activeTab === 'generate' ? (
            <div className={`w-full mx-auto flex flex-col lg:flex-row gap-8 mt-6 md:mt-0 ${isSessionActive ? 'items-stretch' : 'items-center justify-center h-full'}`}>
              
              <div className={`flex-1 flex flex-col ${!isSessionActive ? 'max-w-md w-full' : 'items-center justify-center'}`}>
                {!isSessionActive ? (
                  <div className={`flex flex-col p-6 md:p-8 rounded-xl border w-full gap-5 md:gap-6 ${panelClass}`}>
                    <h2 className={`text-lg md:text-xl font-bold uppercase tracking-wide border-b pb-3 md:pb-4 ${isDarkMode ? 'text-gray-100 border-gray-800' : 'text-gray-900 border-gray-200'}`}>Session Config</h2>
                    
                    <div className="flex flex-col gap-1.5 md:gap-2">
                      <label className={`text-[10px] md:text-xs font-mono uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Course Code</label>
                      <input 
                        type="text" 
                        value={classId} 
                        onChange={(e) => setClassId(e.target.value.toUpperCase())} 
                        className={`rounded-md font-mono focus:outline-none focus:border-orange-500 px-3 py-2 border text-sm md:text-base ${inputClass}`} 
                        placeholder="CS101"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5 md:gap-2">
                      <label className={`text-[10px] md:text-xs font-mono uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Token Rotation Interval (s)</label>
                      <input 
                        type="number" 
                        min="5" 
                        max="300" 
                        value={qrDuration} 
                        onChange={(e) => setQrDuration(Number(e.target.value))} 
                        className={`rounded-md font-mono focus:outline-none focus:border-orange-500 px-3 py-2 border text-sm md:text-base ${inputClass}`} 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:gap-2">
                      <label className={`text-[10px] md:text-xs font-mono uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Network Restrict</label>
                      <div 
                        onClick={toggleNetworkLock}
                        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer border ${inputClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs md:text-sm font-bold ${isNetworkLocked ? 'text-emerald-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isNetworkLocked ? 'Enforced' : 'Disabled'}
                          </span>
                        </div>
                        <div className={`relative inline-flex h-4 w-8 md:h-5 md:w-9 items-center rounded-full ${isNetworkLocked ? 'bg-emerald-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-3 w-3 md:h-3.5 md:w-3.5 transform rounded-full bg-white transition-transform ${isNetworkLocked ? 'translate-x-4' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={startSession} 
                      className="mt-2 md:mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 md:py-4 rounded-md font-bold w-full text-sm md:text-base"
                    >
                      Initialize Session
                    </button>
                  </div>
                ) : (
                  <div className={`text-center p-6 md:p-14 rounded-xl w-full max-w-2xl flex flex-col items-center border ${panelClass}`}>
                    <div className={`px-4 md:px-6 py-1.5 md:py-2 rounded-md border mb-6 md:mb-8 inline-flex items-center gap-2 md:gap-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                      <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500"></span>
                      <span className={`font-mono font-bold text-xs md:text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>ACTIVE: {classId}</span>
                    </div>
                    
                    {token ? (
                      <>
                        <div className="flex justify-center p-4 md:p-8 bg-white rounded-lg border border-gray-200 w-full max-w-[280px] md:max-w-[400px]">
                           <QRCode 
                             value={JSON.stringify({ classId, token })} 
                             size={320} 
                             style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                           />
                        </div>
                        <p className={`font-mono font-extrabold mt-6 md:mt-10 text-4xl md:text-6xl ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>
                          {formatTime(timeLeft)}
                        </p>
                      </>
                    ) : (
                      <div className={`h-[300px] md:h-[400px] flex items-center justify-center font-mono font-bold text-sm md:text-base ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Awaiting token generation...
                      </div>
                    )}

                    <button 
                      onClick={stopSession} 
                      className={`mt-8 md:mt-12 px-6 md:px-8 py-2.5 md:py-3 rounded-md font-bold w-full max-w-xs border text-sm md:text-base ${isDarkMode ? 'bg-transparent border-red-500/50 text-red-500 hover:bg-red-900/20' : 'bg-transparent border-red-200 text-red-600 hover:bg-red-50'}`}
                    >
                      Terminate Session
                    </button>
                  </div>
                )}
              </div>

              {isSessionActive && (
                <div className={`w-full lg:w-80 border rounded-xl flex flex-col overflow-hidden mt-6 lg:mt-0 ${panelClass}`}>
                  <div className={`border-b px-4 md:px-6 py-4 flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <h3 className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Verified Scans</h3>
                    <span className="bg-orange-600 text-white font-mono text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-sm">{attendedStudents.length}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 max-h-[300px] lg:max-h-full">
                    {attendedStudents.length === 0 ? (
                      <div className={`h-full flex flex-col items-center justify-center space-y-2 md:space-y-3 p-4 md:p-6 text-center ${isDarkMode ? 'text-gray-600' : 'text-gray-400 font-medium'}`}>
                        <svg className="w-8 h-8 md:w-10 md:h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                        <p className="text-xs md:text-sm">Awaiting input...</p>
                      </div>
                    ) : (
                      attendedStudents.map((student, index) => (
                        <div key={index} className={`border rounded-md p-2 md:p-3 flex items-center gap-2 md:gap-3 ${isDarkMode ? 'border-gray-800 bg-[#0b101a]' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-sm flex items-center justify-center font-bold text-xs md:text-sm bg-emerald-500/20 text-emerald-500">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs md:text-sm font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{student.name}</p>
                            <p className={`text-[10px] md:text-xs truncate font-mono ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{student.email}</p>
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