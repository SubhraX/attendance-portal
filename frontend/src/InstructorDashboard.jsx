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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-cyan-700 selection:text-white">
      
      {/* Pterodactyl Style Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-600 rounded-md flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-600/20">
            ERP
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-100">Faculty Panel</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'live' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>Console</button>
          <button onClick={() => setActiveTab('records')} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'records' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>Records</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 mt-4">
        {activeTab === 'live' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Controls */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Server Info Card */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-sm">
                <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Session Controls</h2>
                </div>
                <div className="p-4 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target Class</label>
                    <div className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-sm font-mono text-gray-300">
                      {classId}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">QR Refresh (Seconds)</label>
                    <input 
                      type="number" 
                      min="5" max="120" 
                      value={qrDuration} 
                      onChange={(e) => setQrDuration(Number(e.target.value))} 
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-sm text-gray-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors" 
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-700 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">Lock to Campus Wi-Fi</label>
                    <button 
                      onClick={toggleNetworkLock}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${isNetworkLocked ? 'bg-cyan-500' : 'bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isNetworkLocked ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 border-t border-gray-700">
                  <button onClick={startSession} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded transition-colors text-sm shadow-lg shadow-cyan-600/20">
                    Start Live Rotation
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Terminal/QR Display */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg border border-gray-700 h-full min-h-[400px] shadow-sm flex flex-col">
                <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <h2 className="ml-2 text-sm font-bold text-gray-300 font-mono">live_projection_terminal</h2>
                </div>
                
                <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#0a0a0a] rounded-b-lg">
                  {token ? (
                    <div className="flex flex-col items-center animate-fade-in-up">
                      <div className="p-4 bg-white rounded-lg">
                         <QRCode value={JSON.stringify({ classId, token })} size={280} />
                      </div>
                      <div className="mt-8 text-center font-mono">
                        <span className="text-gray-500 text-sm">Next rotation in</span>
                        <div className="text-cyan-400 font-bold text-3xl mt-1">
                          00:{timeLeft.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 font-mono text-sm flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      Waiting for session initialization...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Student Records</h2>
            <p className="text-gray-400 text-sm">Calendar view and export functions will load here.</p>
          </div>
        )}
      </div>
    </div>
  );
}