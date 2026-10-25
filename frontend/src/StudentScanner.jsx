import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export default function StudentScanner() {
  const [message, setMessage] = useState('');
  const [statusColor, setStatusColor] = useState('text-gray-400');
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
          setStatusColor('text-red-400 bg-red-900/20 border-red-900/50');
          setTimeout(() => scanner.resume(), 3000);
        }
      } catch (err) {
        setMessage('❌ Invalid QR Format');
        setStatusColor('text-red-400 bg-red-900/20 border-red-900/50');
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
      <div className="fixed inset-0 bg-[#0b0f19]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-all duration-500 font-sans">
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

  // High-Tech Scanner UI
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 font-sans selection:bg-[#2563eb] selection:text-white">
      
      {/* Overriding the default Html5QrcodeScanner styles to match the dark theme */}
      <style>{`
        #reader { border: none !important; width: 100% !important; }
        #reader button { background-color: #2563eb !important; color: white !important; padding: 10px 20px !important; border-radius: 12px !important; border: none !important; margin: 8px 4px !important; font-weight: 600 !important; cursor: pointer !important; transition: all 0.2s !important; box-shadow: 0 4px 15px rgba(37,99,235,0.2) !important; font-family: inherit !important; }
        #reader button:hover { background-color: #1d4ed8 !important; transform: translateY(-1px) !important; }
        #reader select { background-color: #0b0f19 !important; color: #e2e8f0 !important; border: 1px solid #1e293b !important; padding: 12px !important; border-radius: 12px !important; margin-bottom: 16px !important; width: 100% !important; max-width: 100% !important; outline: none !important; font-family: inherit !important; font-size: 14px !important; transition: border-color 0.2s !important; }
        #reader select:focus { border-color: #5c98ff !important; }
        #reader a { color: #5c98ff !important; text-decoration: none !important; font-weight: 500 !important; }
        #reader a:hover { text-decoration: underline !important; }
        #reader span, #reader div { color: #94a3b8 !important; font-family: inherit !important; }
        #reader video { border-radius: 16px !important; margin-top: 16px !important; border: 1px solid #1e293b !important; width: 100% !important; object-fit: cover !important; }
        #qr-shaded-region { border-color: rgba(11, 15, 25, 0.8) !important; }
      `}</style>

      <div className="w-full max-w-md bg-[#151b2b] border border-[#1e293b] rounded-3xl p-8 shadow-2xl animate-fade-in-up">
        
        {/* Sleek Verification Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mb-5 border border-[#2563eb]/20 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
            <svg className="w-7 h-7 text-[#5c98ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Identity<span className="text-[#5c98ff]">Scanner</span></h2>
          <p className="text-gray-400 text-sm mt-2 text-center max-w-[250px]">Point your camera at the live session QR code to record attendance.</p>
        </div>

        {/* Camera Container */}
        <div className="w-full mb-6 bg-[#0b0f19] border border-[#1e293b] rounded-2xl p-4 shadow-inner flex flex-col items-center">
          <div id="reader"></div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 text-center text-sm font-semibold rounded-xl border transition-all animate-fade-in-up ${statusColor}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}