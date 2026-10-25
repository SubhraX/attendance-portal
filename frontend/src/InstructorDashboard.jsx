import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState('live'); 
  const [token, setToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrDuration, setQrDuration] = useState(30);
  const [isNetworkLocked, setIsNetworkLocked] = useState(false);
  const classId = 'CS101'; 

  const startSession = async () => {
    const authToken = localStorage.getItem('token');
    const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ classId, qrDuration })
    });
    
    if(res.ok) {
      const socket = new WebSocket('wss://attendance-portal-p2lp.onrender.com');
      socket.onopen = () => socket.send(JSON.stringify({ action: 'startRotation', classId, duration: qrDuration }));
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_QR_TOKEN') {
          setToken(data.token);
          setTimeLeft(qrDuration); 
        }
      };
    } else {
      alert("Failed to start session. Check permissions.");
    }
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

  // Fixes the counter bug by converting raw seconds into MM:SS format
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-6 shadow-xl z-10">
        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-8">Faculty<span className="text-blue-500">Panel</span></h2>
        <div className="flex flex-col gap-3">
          <button onClick={() => setActiveTab('live')} className={`px-4 py-3 rounded-lg font-bold text-left transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            📡 Live Session
          </button>
          <button onClick={() => setActiveTab('records')} className={`px-4 py-3 rounded-lg font-bold text-left transition-all ${activeTab === 'records' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            📋 Student Records
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 flex flex-col items-center overflow-y-auto">
        {activeTab === 'live' ? (
          <div className="w-full max-w-4xl">
            
            {/* Controls Card */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg">
              <div>
                <h2 className="text-2xl font-bold text-blue-400 mb-1">Session Dashboard</h2>
                <p className="text-slate-400 mb-4">Target Class: {classId}</p>
                
                <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-700">
                  <label className="text-sm font-semibold text-slate-300">QR Refresh (Seconds):</label>
                  <input type="number" min="5" max="300" value={qrDuration} onChange={(e) => setQrDuration(Number(e.target.value))} className="w-20 bg-slate-800 text-white p-1 rounded text-center focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6 md:mt-0">
                <button onClick={toggleNetworkLock} className={`px-6 py-2 rounded-lg font-bold transition-all text-sm border ${isNetworkLocked ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>
                  {isNetworkLocked ? '🔒 Network Locked' : '🔓 Unlocked (Click to Lock)'}
                </button>
                <button onClick={startSession} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                  Start Live Session
                </button>
              </div>
            </div>
            
            {/* QR Projection */}
            {token && (
              <div className="text-center bg-slate-900 p-8 border border-slate-800 rounded-2xl animate-fade-in-up shadow-2xl max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-6 text-slate-300">Project for Student Scanning</h3>
                <div className="flex justify-center p-4 bg-white rounded-xl inline-block shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                   <QRCode value={JSON.stringify({ classId, token })} size={320} />
                </div>
                <p className="text-emerald-400 font-mono font-extrabold mt-6 text-4xl tracking-wider">
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Attendance Records</h2>
            <p className="text-slate-400">Student list, Calendar View, and CSV/PDF export tools will be built here.</p>
          </div>
        )}
      </div>
    </div>
  );
}