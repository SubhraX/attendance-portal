import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'records'
  const [token, setToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrDuration, setQrDuration] = useState(30);
  const classId = 'CS101'; 

  const startSession = async () => {
    const authToken = localStorage.getItem('token');
    const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ classId, qrDuration }) // Passing custom duration
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

  const lockNetwork = async () => {
    const authToken = localStorage.getItem('token');
    const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/lock-network', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', // Added this
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({}) // Added this empty body
    });
    
    if (res.ok) {
      alert("Success: Attendance is now locked to your current Wi-Fi network.");
    } else {
      const errorData = await res.json();
      alert(`Error: ${errorData.message}`);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      
      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab('live')} className={`px-6 py-2 rounded-lg font-bold ${activeTab === 'live' ? 'bg-blue-600' : 'bg-slate-800'}`}>Live Session</button>
        <button onClick={() => setActiveTab('records')} className={`px-6 py-2 rounded-lg font-bold ${activeTab === 'records' ? 'bg-blue-600' : 'bg-slate-800'}`}>Student Records</button>
      </div>

      {activeTab === 'live' ? (
        <>
          <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-12 p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-blue-400">Faculty Dashboard</h2>
              <p className="text-slate-400 mb-4">Class: {classId}</p>
              
              <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-700">
                <label className="text-sm font-semibold text-slate-300">QR Refresh (Seconds):</label>
                <input type="number" min="5" max="120" value={qrDuration} onChange={(e) => setQrDuration(Number(e.target.value))} className="w-20 bg-slate-800 text-white p-1 rounded text-center" />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6 md:mt-0">
              <button onClick={lockNetwork} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-all text-sm">
                🔒 Lock to Campus Network
              </button>
              <button onClick={startSession} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                Start Live Session
              </button>
            </div>
          </div>
          
          {token && (
            <div className="text-center bg-slate-900 p-8 border border-slate-800 rounded-2xl animate-fade-in-up">
              <h3 className="text-xl font-semibold mb-6 text-slate-300">Project for Student Scanning</h3>
              <div className="flex justify-center p-4 bg-white rounded-xl inline-block shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                 <QRCode value={JSON.stringify({ classId, token })} size={320} />
              </div>
              <p className="text-emerald-400 font-mono font-extrabold mt-6 text-3xl">
                Refreshes in: 00:{timeLeft.toString().padStart(2, '0')}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="w-full max-w-6xl bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Attendance Records</h2>
          <p className="text-slate-400">Student list, Calendar View, and CSV/PDF export tools will be built here.</p>
        </div>
      )}
    </div>
  );
}