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
        setMessage(`Data integrity error.`);
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
        setMessage(`Error: ${data.message}`);
        setTimeout(() => { setMessage(''); setIsCapturing(false); isProcessingRef.current = false; }, 2000);
      }
    } catch (err) {
      setMessage('Network transmission failed.');
      setTimeout(() => { setMessage(''); setIsCapturing(false); isProcessingRef.current = false; }, 2000);
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
      return { deviceId: { exact: bestBackCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } };
    }
    return { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } };
  }, [facingMode, bestBackCameraId]);

  if (isMarked) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
        <div className="bg-white p-8 rounded-sm shadow-md text-center max-w-sm w-full border-t-4 border-green-600">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Record Verified</h2>
          <p className="text-sm text-gray-600">Session logging successful. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans">
      {/* App Bar */}
      <div className="w-full bg-gray-900 text-white h-12 flex items-center justify-between px-4 z-50 border-b border-gray-700">
        <button onClick={() => navigate('/')} className="text-sm hover:text-gray-300">Close</button>
        <h1 className="text-sm font-semibold uppercase tracking-wide text-gray-200">Terminal Scanner</h1>
        <div className="w-10"></div> 
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center">
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
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
           <div className="w-64 h-64 border border-gray-500 relative"></div>
        </div>

        {isCapturing && <div className="absolute inset-0 bg-white z-40 opacity-50 pointer-events-none"></div>}
      </div>

      {/* Toolbar */}
      <div className="w-full bg-gray-900 text-white h-16 flex items-center justify-center gap-8 z-50 border-t border-gray-700">
        <button onClick={toggleFlash} className={`px-4 py-1.5 text-xs rounded-sm border ${isFlashOn ? 'bg-white text-black border-white' : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'}`}>
          Toggle Flash
        </button>
        <button onClick={flipCamera} className="px-4 py-1.5 text-xs rounded-sm border bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
          Switch Camera
        </button>
      </div>

      {message && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[100] bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-sm w-[90%] max-w-sm text-center">
          <p className="text-xs font-semibold">{message}</p>
        </div>
      )}
    </div>
  );
}