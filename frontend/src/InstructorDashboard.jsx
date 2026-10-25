import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState('generate'); 
  const [token, setToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrDuration, setQrDuration] = useState(120);
  const [isNetworkLocked, setIsNetworkLocked] = useState(false);
  const [classId, setClassId] = useState('CS101'); 
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [attendedStudents, setAttendedStudents] = useState([]);

  const startSession = async () => {
    if (!classId.trim()) return alert("Please enter a Target Class.");
    
    const authToken = localStorage.getItem('token');
    const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ classId: classId.trim(), qrDuration })
    });
    
    if(res.ok) {
      setIsSessionActive(true);
      setAttendedStudents([]); 
      
      const socket = new WebSocket('wss://attendance-portal-p2lp.onrender.com');
      socket.onopen = () => socket.send(JSON.stringify({ action: 'startRotation', classId: classId.trim(), duration: qrDuration }));
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_QR_TOKEN') {
          setToken(data.token);
          setTimeLeft(qrDuration); 
        } else if (data.type === 'STUDENT_MARKED') {
          setAttendedStudents(prev => [...prev, data.student]);
        }
      };
    } else {
      alert("Failed to start session. Check permissions.");
    }
  };

  const stopSession = () => {
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` 
        },
        body: JSON.stringify({})
      });
      
      if (res.ok) {
        setIsNetworkLocked(!isNetworkLocked);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Failed to toggle network lock"}`);
      }
    } catch (error) {
      alert("Error: Unable to connect to the server.");
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 flex font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Sidebar Navigation */}
      <div className="w-64 bg-[#101524] border-r border-[#1e293b] flex flex-col p-6 shadow-2xl z-20 relative">
        <h2 className="text-xl font-extrabold text-white tracking-tight mb-10 flex items-center gap-2">
          Faculty<span className="text-[#5c98ff]">Panel</span>
        </h2>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setActiveTab('generate')} 
            className={`px-4 py-3 rounded-xl font-semibold text-left transition-all duration-300 flex items-center gap-3 ${activeTab === 'generate' ? 'bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:bg-[#1a2332] hover:text-gray-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            Generate QR
          </button>
          <button 
            onClick={() => setActiveTab('records')} 
            className={`px-4 py-3 rounded-xl font-semibold text-left transition-all duration-300 flex items-center gap-3 ${activeTab === 'records' ? 'bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:bg-[#1a2332] hover:text-gray-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Student Records
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
        {activeTab === 'generate' ? (
          <div className={`w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 ${isSessionActive ? 'items-stretch' : 'items-center justify-center h-full'}`}>
            
            <div className={`flex-1 flex flex-col ${!isSessionActive ? 'max-w-md w-full' : 'items-center justify-center'}`}>
              
              {!isSessionActive ? (
                /* Vertical List Controls Card */
                <div className="flex flex-col p-8 bg-[#151b2b] rounded-2xl border border-[#1e293b] shadow-lg animate-fade-in-up w-full gap-6">
                  <h2 className="text-2xl font-bold text-[#5c98ff] tracking-wide border-b border-[#1e293b] pb-4">Session Dashboard</h2>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Target Class</label>
                    <input 
                      type="text" 
                      value={classId} 
                      onChange={(e) => setClassId(e.target.value.toUpperCase())} 
                      className="bg-[#0b0f19] border border-[#1e293b] rounded-xl text-white font-mono focus:outline-none focus:border-[#5c98ff] px-4 py-3 transition-colors w-full" 
                      placeholder="E.g. CS101"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider">QR Refresh (Seconds)</label>
                    <input 
                      type="number" 
                      min="5" 
                      max="300" 
                      value={qrDuration} 
                      onChange={(e) => setQrDuration(Number(e.target.value))} 
                      className="bg-[#0b0f19] border border-[#1e293b] rounded-xl text-white font-mono focus:outline-none focus:border-[#5c98ff] px-4 py-3 transition-colors w-full" 
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Security</label>
                    <div 
                      onClick={toggleNetworkLock}
                      className="flex items-center justify-between bg-[#0b0f19] border border-[#1e293b] px-4 py-3.5 rounded-xl cursor-pointer hover:border-gray-600 transition-colors w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{isNetworkLocked ? '🔒' : '🔓'}</span>
                        <span className={`text-sm font-medium transition-colors ${isNetworkLocked ? 'text-emerald-400' : 'text-gray-400 group-hover:text-gray-300'}`}>
                          {isNetworkLocked ? 'Locked to Campus Wi-Fi' : 'Unlocked'}
                        </span>
                      </div>
                      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isNetworkLocked ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isNetworkLocked ? 'translate-x-4' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={startSession} 
                    className="mt-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all w-full active:scale-95 text-lg"
                  >
                    Start Live Session
                  </button>
                </div>
              ) : (
                /* Active QR Projection */
                <div className="text-center bg-[#151b2b] p-10 md:p-14 border border-[#1e293b] rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in-up flex flex-col items-center">
                  <div className="bg-[#101524] px-6 py-2 rounded-full border border-[#1e293b] mb-8 inline-flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-gray-300 font-mono tracking-wider font-semibold">CLASS: {classId}</span>
                  </div>
                  
                  {token ? (
                    <>
                      <div className="flex justify-center p-6 md:p-8 bg-white rounded-2xl shadow-inner w-full max-w-[400px]">
                         <QRCode 
                           value={JSON.stringify({ classId, token })} 
                           size={320} 
                           style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                         />
                      </div>
                      <p className="text-[#2dd4bf] font-mono font-extrabold mt-10 text-5xl md:text-6xl tracking-widest drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                        {formatTime(timeLeft)}
                      </p>
                    </>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500 font-mono">
                      Generating secure token...
                    </div>
                  )}

                  <button 
                    onClick={stopSession} 
                    className="mt-12 bg-red-600/10 text-red-400 border border-red-900/50 hover:bg-red-600 hover:text-white px-8 py-3 rounded-xl font-bold transition-all w-full max-w-xs"
                  >
                    Stop Live Session
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Real-time Attendance Panel */}
            {isSessionActive && (
              <div className="w-full lg:w-80 bg-[#151b2b] border border-[#1e293b] rounded-3xl flex flex-col overflow-hidden shadow-lg animate-fade-in-up">
                <div className="bg-[#101524] border-b border-[#1e293b] px-6 py-5 flex items-center justify-between">
                  <h3 className="font-bold text-gray-200">Live Attendance</h3>
                  <span className="bg-[#2563eb] text-white text-xs font-bold px-2.5 py-1 rounded-full">{attendedStudents.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {attendedStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 p-6 text-center">
                      <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                      <p className="text-sm">Waiting for students to scan...</p>
                    </div>
                  ) : (
                    attendedStudents.map((student, index) => (
                      <div key={index} className="bg-[#101524] border border-[#1e293b] rounded-xl p-3 flex items-center gap-3 animate-fade-in-up">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-200 truncate">{student.name}</p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div className="w-full max-w-5xl bg-[#151b2b] rounded-2xl border border-[#1e293b] p-8 shadow-lg animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Attendance Records</h2>
            <p className="text-gray-400">Student list, Calendar View, and CSV/PDF export tools will be built here.</p>
          </div>
        )}
      </div>
    </div>
  );
}