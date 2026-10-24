import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function InstructorDashboard() {
  const [token, setToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const classId = 'CS101'; 

  const startSession = async () => {
    const authToken = localStorage.getItem('token');
    const res = await fetch('/api/attendance/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ classId })
    });
    
    if(res.ok) {
      const socket = new WebSocket('ws://localhost:5000');
      socket.onopen = () => socket.send(JSON.stringify({ action: 'startRotation', classId }));
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_QR_TOKEN') {
          setToken(data.token);
          setTimeLeft(30); 
        }
      };
    } else {
      alert("Failed to start session. Check permissions.");
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
      <div className="w-full max-w-4xl flex justify-between items-center mb-12 p-6 bg-slate-900 rounded-2xl border border-slate-800 mt-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-400">Faculty Dashboard</h2>
          <p className="text-slate-400">Class: {classId}</p>
        </div>
        <button onClick={startSession} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
          Start Live Session
        </button>
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
    </div>
  );
}