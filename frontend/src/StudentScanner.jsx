import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function StudentScanner() {
  const [message, setMessage] = useState('');
  const [isMarked, setIsMarked] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); 
  const [isCapturing, setIsCapturing] = useState(false);
  
  const isProcessingRef = useRef(false); 
  const navigate = useNavigate();

  // Pinch-to-Zoom Refs
  const initialTouchDist = useRef(null);
  const currentZoom = useRef(1);

  useEffect(() => {
    if (isMarked) {
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMarked, navigate]);

  const processQRData = async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (navigator.vibrate) navigator.vibrate(50);
    setIsCapturing(true);

    try {
      let classId, token;
      try {
        const qrData = JSON.parse(decodedText);
        classId = qrData.classId;
        token = qrData.token;
      } catch (parseError) {
        setMessage(`Format Error. QR contains: "${decodedText}"`);
        setTimeout(() => {
          setMessage('');
          setIsCapturing(false);
          isProcessingRef.current = false;
        }, 4000);
        return;
      }

      const authToken = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ classId: classId, scannedToken: token })
      });

      const data = await res.json();
      if (res.ok) {
        setTimeout(() => {
          setIsCapturing(false);
          setIsMarked(true);
        }, 400);
      } else {
        setMessage(`❌ ${data.message}`);
        setTimeout(() => {
          setMessage('');
          setIsCapturing(false);
          isProcessingRef.current = false;
        }, 2000);
      }
    } catch (err) {
      setMessage('❌ Network Error');
      setTimeout(() => {
        setMessage('');
        setIsCapturing(false);
        isProcessingRef.current = false;
      }, 2000);
    }
  };

  // NATIVE CAMERA CONSTRAINTS (Bypasses React Remounting)
  const applyNativeConstraint = async (constraints) => {
    const video = document.querySelector('video');
    if (!video || !video.srcObject) return false;
    
    const track = video.srcObject.getVideoTracks()[0];
    if (!track || typeof track.applyConstraints !== 'function') return false;

    try {
      // 1. Force the constraint directly. 
      // Modern Android Chrome requires torch to be inside the 'advanced' array.
      await track.applyConstraints({ advanced: [constraints] });
      return true;
    } catch (err) {
      try {
        // 2. Fallback for iOS Safari which prefers direct application
        await track.applyConstraints(constraints);
        return true;
      } catch (fallbackErr) {
        console.warn("Hardware rejected constraint:", fallbackErr);
        return false; // Only fail if the hardware actively rejects both attempts
      }
    }
  };

  // Pinch-to-Zoom Logic
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialTouchDist.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialTouchDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / initialTouchDist.current;
      let newZoom = Math.min(Math.max(currentZoom.current * scale, 1), 5); 
      
      applyNativeConstraint({ zoom: newZoom }); 
      
      initialTouchDist.current = dist;
      currentZoom.current = newZoom;
    }
  };

  const handleTouchEnd = () => {
    initialTouchDist.current = null;
  };

  const toggleFlash = async () => {
    const newState = !isFlashOn;
    const success = await applyNativeConstraint({ torch: newState });
    
    if (success) {
      setIsFlashOn(newState);
    } else {
      setMessage('Flash is not supported on this browser/device.');
      setTimeout(() => setMessage(''), 3000);
    }
  };
  
  const flipCamera = () => {
    setMessage('Switching camera...');
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    currentZoom.current = 1; 
    setTimeout(() => setMessage(''), 500);
  };

  const cameraConstraints = useMemo(() => ({
    facingMode: facingMode,
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }), [facingMode]);

  if (isMarked) {
    return (
      <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center animate-fade-in-up">
          <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
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

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans selection:bg-[#2563eb] selection:text-white">

      <div className="absolute top-0 left-0 w-full p-5 flex items-center justify-between z-50 bg-gradient-to-b from-black/90 to-transparent">
        <button onClick={() => navigate('/')} className="text-white p-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-white font-semibold text-lg tracking-wider drop-shadow-md">Scan QR</h1>
        <div className="w-11"></div> 
      </div>

      <style>{`
        .flash-snap { animation: snap 0.4s ease-out forwards; }
        @keyframes snap {
          0% { opacity: 0; transform: scale(1); }
          30% { opacity: 1; transform: scale(0.98); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>

      <div className="absolute left-0 w-full h-[135vh] -top-[25vh]">
        {!isProcessingRef.current && !isMarked && (
          <Scanner 
            onScan={(result) => {
              if (result && result.length > 0) {
                processQRData(result[0].rawValue);
              }
            }}
            formats={['qr_code']}
            constraints={cameraConstraints}
            components={{
              audio: false,
              tracker: true, 
              finder: false
            }}
            styles={{
              container: { width: '100%', height: '100%' },
              video: { width: '100%', height: '100%', objectFit: 'cover' }
            }}
          />
        )}
        
        {/* Invisible Overlay for Pinch-to-Zoom & Target Reticle */}
        <div 
          className="absolute inset-0 z-30 flex items-center justify-center touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
           <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl -mb-1 -mr-1"></div>
           </div>
        </div>

        {isCapturing && (
          <div className="absolute inset-0 bg-white z-40 pointer-events-none flash-snap"></div>
        )}
      </div>

      {/* Centered Camera Controls (Flash and Flip only) */}
      <div className="absolute bottom-12 left-0 w-full flex justify-center gap-16 z-50">
        <div className="flex flex-col items-center gap-2">
          <button onClick={toggleFlash} className={`w-14 h-14 backdrop-blur-lg border border-white/10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${isFlashOn ? 'bg-white text-black' : 'bg-black/40 text-white hover:bg-white/10'}`}>
            <svg className="w-6 h-6" fill={isFlashOn ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
          <span className="text-white text-xs font-medium drop-shadow-md">Flash</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button onClick={flipCamera} className="w-14 h-14 bg-black/40 backdrop-blur-lg border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <span className="text-white text-xs font-medium drop-shadow-md">Flip</span>
        </div>
      </div>

      {message && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] bg-black/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl w-auto max-w-[80vw] flex items-center justify-center pointer-events-none">
          <p className="text-white font-bold text-sm text-center leading-snug whitespace-pre-wrap">{message}</p>
        </div>
      )}
    </div>
  );
}