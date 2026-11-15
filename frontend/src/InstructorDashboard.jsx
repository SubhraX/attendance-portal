import { useEffect, useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import FacultyRecords from './FacultyRecords'; 
import { useTheme } from './ThemeContext';

export default function InstructorDashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('generate'); 
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
    } catch (error) {
      alert("Error connecting to server.");
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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`min-h-screen flex font-sans selection:bg-orange-600 selection:text-white ${isDarkMode ? 'bg-[#0b0f19] text-gray-200' : 'bg-[#fffaf0] text-orange-950'}`}>
      
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r flex flex-col p-6 shadow-2xl z-20 relative ${isDarkMode ? 'bg-[#101524] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
        
        {/* Upper Left Logo & Title */}
        <div className={`flex items-center gap-3 mb-10 pb-6 border-b ${isDarkMode ? 'border-[#1e293b]' : 'border-orange-100'}`}>
          <img 
            src="/BITS_logo.png" 
            alt="BIT Mesra" 
            className="w-12 h-12 object-contain drop-shadow-md bg-white/10 rounded-full p-1 shrink-0"
          />
          <div className="flex flex-col">
            <h2 className={`text-lg font-extrabold tracking-wide uppercase leading-tight ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>
              BIT Mesra
            </h2>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>
              Faculty Panel
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setActiveTab('generate')} 
            className={`px-4 py-3 rounded-xl font-semibold text-left transition-all duration-300 flex items-center gap-3 ${activeTab === 'generate' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : isDarkMode ? 'text-gray-400 hover:bg-[#1a2332] hover:text-gray-200' : 'text-orange-900 hover:bg-orange-50 hover:text-orange-950'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            Generate QR
          </button>
          <button 
            onClick={() => setActiveTab('records')} 
            className={`px-4 py-3 rounded-xl font-semibold text-left transition-all duration-300 flex items-center gap-3 ${activeTab === 'records' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : isDarkMode ? 'text-gray-400 hover:bg-[#1a2332] hover:text-gray-200' : 'text-orange-900 hover:bg-orange-50 hover:text-orange-950'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Student Records
          </button>
        </div>

        {/* Theme Toggle Button */}
        <div className={`mt-auto pt-6 border-t ${isDarkMode ? 'border-[#1e293b]' : 'border-orange-100'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${isDarkMode ? 'bg-[#1a2332] text-gray-300 hover:bg-[#252f44] hover:text-white' : 'bg-orange-50 text-orange-800 hover:bg-orange-100 hover:text-orange-950'}`}
          >
            {isDarkMode ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Light Mode
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                Dark Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
        {activeTab === 'generate' ? (
          <div className={`w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 ${isSessionActive ? 'items-stretch' : 'items-center justify-center h-full'}`}>
            
            <div className={`flex-1 flex flex-col ${!isSessionActive ? 'max-w-md w-full' : 'items-center justify-center'}`}>
              {!isSessionActive ? (
                /* Session Controls */
                <div className={`flex flex-col p-8 rounded-2xl border shadow-lg animate-fade-in-up w-full gap-6 ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
                  <h2 className={`text-2xl font-bold tracking-wide border-b pb-4 ${isDarkMode ? 'text-orange-500 border-[#1e293b]' : 'text-orange-700 border-orange-100'}`}>Session Dashboard</h2>
                  
                  <div className="flex flex-col gap-2">
                    <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900'}`}>Target Class</label>
                    <input 
                      type="text" 
                      value={classId} 
                      onChange={(e) => setClassId(e.target.value.toUpperCase())} 
                      className={`rounded-xl font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 px-4 py-3 transition-colors w-full ${isDarkMode ? 'bg-[#0b0f19] border-[#1e293b] text-white' : 'bg-[#fffaf0] border-orange-200 text-orange-950'}`} 
                      placeholder="E.g. CS101"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900'}`}>QR Refresh (Seconds)</label>
                    <input 
                      type="number" 
                      min="5" 
                      max="300" 
                      value={qrDuration} 
                      onChange={(e) => setQrDuration(Number(e.target.value))} 
                      className={`rounded-xl font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 px-4 py-3 transition-colors w-full ${isDarkMode ? 'bg-[#0b0f19] border-[#1e293b] text-white' : 'bg-[#fffaf0] border-orange-200 text-orange-950'}`} 
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900'}`}>Security</label>
                    <div 
                      onClick={toggleNetworkLock}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-colors w-full group border ${isDarkMode ? 'bg-[#0b0f19] border-[#1e293b] hover:border-orange-500/50' : 'bg-[#fffaf0] border-orange-200 hover:border-orange-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{isNetworkLocked ? '🔒' : '🔓'}</span>
                        <span className={`text-sm font-medium transition-colors ${isNetworkLocked ? 'text-emerald-500' : isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-orange-800 group-hover:text-orange-950'}`}>
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
                    className="mt-4 bg-orange-600 hover:bg-orange-500 text-white px-6 py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-all w-full active:scale-95 text-lg"
                  >
                    Start Live Session
                  </button>
                </div>
              ) : (
                /* Active QR Projection */
                <div className={`text-center p-10 md:p-14 rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in-up flex flex-col items-center border ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
                  <div className={`px-6 py-2 rounded-full border mb-8 inline-flex items-center gap-3 ${isDarkMode ? 'bg-[#101524] border-[#1e293b]' : 'bg-orange-50 border-orange-200'}`}>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className={`font-mono tracking-wider font-semibold ${isDarkMode ? 'text-gray-300' : 'text-orange-900'}`}>CLASS: {classId}</span>
                  </div>
                  
                  {token ? (
                    <>
                      <div className={`flex justify-center p-6 md:p-8 bg-white rounded-2xl shadow-inner w-full max-w-[400px] ${isDarkMode ? '' : 'border border-orange-100'}`}>
                         <QRCode 
                           value={JSON.stringify({ classId, token })} 
                           size={320} 
                           style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                         />
                      </div>
                      <p className={`font-mono font-extrabold mt-10 text-5xl md:text-6xl tracking-widest drop-shadow-[0_0_15px_rgba(234,88,12,0.3)] ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>
                        {formatTime(timeLeft)}
                      </p>
                    </>
                  ) : (
                    <div className={`h-[400px] flex items-center justify-center font-mono ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50 font-bold'}`}>
                      Generating secure token...
                    </div>
                  )}

                  <button 
                    onClick={stopSession} 
                    className={`mt-12 px-8 py-3 rounded-xl font-bold transition-all w-full max-w-xs border ${isDarkMode ? 'bg-red-600/10 text-red-400 border-red-900/50 hover:bg-red-600 hover:text-white' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white'}`}
                  >
                    Stop Live Session
                  </button>
                </div>
              )}
            </div>

            {/* Live Attendance Panel */}
            {isSessionActive && (
              <div className={`w-full lg:w-80 border rounded-3xl flex flex-col overflow-hidden shadow-lg animate-fade-in-up ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
                <div className={`border-b px-6 py-5 flex items-center justify-between ${isDarkMode ? 'bg-[#101524] border-[#1e293b]' : 'bg-orange-50 border-orange-200'}`}>
                  <h3 className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-orange-950'}`}>Live Attendance</h3>
                  <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{attendedStudents.length}</span>
                </div>
                
                <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${isDarkMode ? 'bg-transparent' : 'bg-[#fffaf0]'}`}>
                  {attendedStudents.length === 0 ? (
                    <div className={`h-full flex flex-col items-center justify-center space-y-3 p-6 text-center ${isDarkMode ? 'text-gray-500' : 'text-orange-800/60 font-medium'}`}>
                      <svg className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-orange-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                      <p className="text-sm">Waiting for students to scan...</p>
                    </div>
                  ) : (
                    attendedStudents.map((student, index) => (
                      <div key={index} className={`border rounded-xl p-3 flex items-center gap-3 animate-fade-in-up ${isDarkMode ? 'bg-[#101524] border-[#1e293b]' : 'bg-white border-orange-100 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-orange-500/20 text-orange-500' : 'bg-orange-100 text-orange-700'}`}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-orange-950'}`}>{student.name}</p>
                          <p className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-orange-700/80 font-medium'}`}>{student.email}</p>
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
  );
}