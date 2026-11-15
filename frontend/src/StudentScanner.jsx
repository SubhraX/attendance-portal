import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function StudentScanner() {
  const [message, setMessage] = useState('');
  const [isMarked, setIsMarked] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); 
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [bestBackCameraId, setBestBackCameraId] = useState(null);
  const [cameraResolved, setCameraResolved] = useState(false);
  
  const isProcessingRef = useRef(false); 
  const navigate = useNavigate();

  useEffect(() => {
    if (isMarked) {
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, [isMarked, navigate]);

  useEffect(() => {
    let isMounted = true;
    const findOptimalCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const devices = await navigator.mediaDevices.enumerateDevices();
        stream.getTracks().forEach(track => track.stop());

        const backCameras = devices.filter(d => 
          d.kind === 'videoinput' && 
          (d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment') || d.label.toLowerCase().includes('rear'))
        );

        if (backCameras.length > 0) {
          let mainLens = backCameras.find(d => 
            !d.label.toLowerCase().includes('logical') && 
            !d.label.toLowerCase().includes('wide') && 
            !d.label.toLowerCase().includes('depth') &&
            d.label.includes('0') 
          ) || backCameras.find(d => !d.label.toLowerCase().includes('logical'));
          
          if (mainLens && isMounted) setBestBackCameraId(mainLens.deviceId);
        }
      } catch (err) {
        console.warn("Hardware enumeration fallback:", err);
      } finally {
        if (isMounted) setCameraResolved(true);
      }
    };

    findOptimalCamera();
    return () => { isMounted = false; };
  }, []);

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
      } catch {
        setMessage(`Data integrity error. Format invalid.`);
        setTimeout(() => { setMessage(''); setIsCapturing(false); isProcessingRef.current = false; }, 3000);
        return;
      }

      const authToken = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ classId, scannedToken: token })
      });

      const data = await res.json();
      if (res.ok) {
        setIsCapturing(false);
        setIsMarked(true);
      } else {
        setMessage(`Verification failed: ${data.message}`);
        setTimeout(() => { setMessage(''); setIsCapturing(false); isProcessingRef.current = false; }, 3000);
      }
    } catch (err) {
      setMessage('Network transmission failed. Check connection.');
      setTimeout(() => { setMessage(''); setIsCapturing(false); isProcessingRef.current = false; }, 3000);
    }
  };

  const applyNativeConstraint = async (constraints) => {
    const video = document.querySelector('video');
    if (!video || !video.srcObject) return false;
    
    const track = video.srcObject.getVideoTracks()[0];
    if (!track || typeof track.applyConstraints !== 'function') return false;

    try {
      await track.applyConstraints({ advanced: [constraints] });
      return true;
    } catch {
      try {
        await track.applyConstraints(constraints);
        return true;
      } catch {
        return false;
      }
    }
  };

  const toggleFlash = async () => {
    const newState = !isFlashOn;
    const success = await applyNativeConstraint({ torch: newState });
    if (success) setIsFlashOn(newState);
    else {
      setMessage('Hardware flash unsupported on current lens.');
      setTimeout(() => setMessage(''), 3000);
    }
  };
  
  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const cameraConstraints = useMemo(() => {
    if (facingMode === 'environment' && bestBackCameraId) {
      return { deviceId: { exact: bestBackCameraId }, width: { ideal: 1920 }, height: { ideal: 1080 } };
    }
    return { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } };
  }, [facingMode, bestBackCameraId]);

  if (isMarked) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Record Verified</h2>
          <p className="text-sm text-gray-500">Session logging successful. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans">
      {/* App Bar */}
      <div className="w-full bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 text-white h-20 flex items-center justify-between px-6 z-50 pt-safe">
        <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <h1 className="text-sm font-semibold uppercase tracking-widest text-white drop-shadow-md">Scanner</h1>
        <div className="w-10"></div> 
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {cameraResolved && !isProcessingRef.current && !isMarked && (
          <Scanner 
            onScan={(result) => { if (result && result.length > 0) processQRData(result[0].rawValue); }}
            formats={['qr_code']}
            constraints={cameraConstraints}
            components={{ audio: false, tracker: true, finder: false }}
            styles={{ container: { width: '100%', height: '100%' }, video: { width: '100%', height: '100%', objectFit: 'cover' } }}
          />
        )}
        
        {/* Reticle overlay */}
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
           <div className="w-64 h-64 border-2 border-white/40 rounded-2xl relative">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-xl -ml-0.5 -mt-0.5"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-xl -mr-0.5 -mt-0.5"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-xl -ml-0.5 -mb-0.5"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-xl -mr-0.5 -mb-0.5"></div>
           </div>
        </div>

        {isCapturing && <div className="absolute inset-0 bg-white z-40 opacity-50 pointer-events-none transition-opacity duration-200"></div>}
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-8 z-50 bg-black/40 backdrop-blur-md px-6 py-4 rounded-full border border-white/10">
        <button onClick={toggleFlash} className={`flex flex-col items-center gap-1 transition-transform active:scale-95 ${isFlashOn ? 'text-orange-500' : 'text-white'}`}>
          <div className={`p-3 rounded-full ${isFlashOn ? 'bg-orange-500/20' : 'bg-white/10'}`}>
            <svg className="w-6 h-6" fill={isFlashOn ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider">Flash</span>
        </button>
        <button onClick={flipCamera} className="flex flex-col items-center gap-1 transition-transform active:scale-95 text-white">
          <div className="p-3 rounded-full bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider">Flip</span>
        </button>
      </div>

      {/* Error Toast */}
      {message && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[100] bg-red-600/90 backdrop-blur-md text-white px-5 py-3 rounded-xl shadow-xl w-[90%] max-w-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <p className="text-sm font-semibold">{message}</p>
        </div>
      )}
    </div>
  );
}