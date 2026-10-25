import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export default function StudentScanner() {
  const [message, setMessage] = useState('');
  const [statusColor, setStatusColor] = useState('text-slate-400');
  const [isMarked, setIsMarked] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect effect
  useEffect(() => {
    if (isMarked) {
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMarked, navigate]);

  // Scanner effect
  useEffect(() => {
    if (isMarked) return; 

    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);

    scanner.render(async (decodedText) => {
      scanner.pause(true);
      try {
        const qrData = JSON.parse(decodedText);
        const authToken = localStorage.getItem('token');

        const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify({ classId: qrData.classId, scannedToken: qrData.token })
        });

        const data = await res.json();
        if (res.ok) {
          setIsMarked(true); 
          scanner.clear(); 
        } else {
          setMessage(`❌ ${data.message}`);
          setStatusColor('text-red-400');
          setTimeout(() => scanner.resume(), 3000);
        }
      } catch (err) {
        setMessage('❌ Invalid QR Format');
        setStatusColor('text-red-400');
        setTimeout(() => scanner.resume(), 2000);
      }
    }, undefined);

    return () => {
      if (!isMarked) scanner.clear().catch(console.error);
    };
  }, [isMarked]);

  // Minimal Glowing Success Screen
  if (isMarked) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all duration-500">
        <div className="flex flex-col items-center animate-fade-in-up">
          <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <svg className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-widest uppercase">Verified</h2>
          <p className="text-gray-400 text-sm animate-pulse">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  // Standard Scanner UI
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center pt-12">
      <style>{`
        #reader { border: none !important; }
        #reader button { background-color: #2563eb !important; color: white !important; padding: 8px 16px !important; border-radius: 8px !important; border: none !important; margin: 4px !important; font-weight: 600 !important; cursor: pointer !important; transition: background-color 0.2s !important; }
        #reader button:hover { background-color: #1d4ed8 !important; }
        #reader select { background-color: #1e293b !important; color: white !important; border: 1px solid #334155 !important; padding: 10px !important; border-radius: 8px !important; margin-bottom: 12px !important; width: 100% !important; max-width: 320px !important; outline: none !important; }
        #reader a { color: #60a5fa !important; text-decoration: none !important; }
        #reader a:hover { text-decoration: underline !important; }
        #reader span, #reader div { color: #94a3b8 !important; }
        #reader video { border-radius: 12px !important; margin-top: 12px !important; border: 1px solid #334155 !important; }
      `}</style>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-6 text-center text-emerald-400">Scanner Portal</h2>

        <div id="reader" className="w-full mb-6 rounded-xl bg-slate-950 p-2 flex flex-col items-center"></div>

        {message && (
          <div className={`p-4 text-center text-lg font-bold bg-slate-950 border border-slate-800 rounded-lg ${statusColor} animate-fade-in-up`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}