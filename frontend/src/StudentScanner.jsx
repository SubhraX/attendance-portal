import { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export default function StudentScanner() {
  const [message, setMessage] = useState('');
  const [isMarked, setIsMarked] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); 
  const [isFlipping, setIsFlipping] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isProcessingRef = useRef(false); 
  const navigate = useNavigate();

  useEffect(() => {
    if (isMarked) {
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMarked, navigate]);

  const onScanSuccess = useCallback(async (decodedText) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

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
        if (scannerRef.current?.isScanning) {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        }
      } else {
        setMessage(`❌ ${data.message}`);
        setTimeout(() => {
          setMessage('');
          isProcessingRef.current = false;
        }, 3000);
      }
    } catch (err) {
      setMessage('❌ Invalid QR Format');
      setTimeout(() => {
        setMessage('');
        isProcessingRef.current = false;
      }, 2000);
    }
  }, []);

  const startCamera = async (mode) => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    if (scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }

    try {
      await scannerRef.current.start(
        { facingMode: mode },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {} 
      );
      setIsFlashOn(false);
      setZoom(1); 
    } catch (err) {
      console.error("Camera error:", err);
      setMessage("Camera access denied or unavailable.");
    }
  };

  useEffect(() => {
    if (isMarked) return;
    
    let isMounted = true;
    startCamera(facingMode).then(() => {
      if (!isMounted && scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    });

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleGalleryUpload = async (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    setMessage('Scanning image...');

    try {
      const decodedText = await scannerRef.current?.scanFile(file, true);
      if (decodedText) {
         onScanSuccess(decodedText);
      }
    } catch (err) {
      setMessage('❌ No valid QR code found in image');
      setTimeout(() => setMessage(''), 2000);
    }
    e.target.value = ''; 
  };

  const toggleFlash = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      const newFlashState = !isFlashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newFlashState }]
      });
      setIsFlashOn(newFlashState);
    } catch (error) {
      setMessage('Flash not supported on this device');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleZoom = async (e) => {
    const newZoom = Number(e.target.value);
    setZoom(newZoom);
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ zoom: newZoom }]
      });
    } catch (error) {
      // Zoom not supported silently fails
    }
  };

  const flipCamera = () => {
    setIsFlipping(true);
    setTimeout(async () => {
      const newMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(newMode);
      setMessage('Switching camera...');
      await startCamera(newMode);
      setMessage('');
      setIsFlipping(false);
    }, 300); 
  };

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
      
      {/* Top Nav */}
      <div className="absolute top-0 left-0 w-full p-5 flex items-center justify-between z-50 bg-gradient-to-b from-black/90 to-transparent">
        <button onClick={() => navigate('/')} className="text-white p-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-white font-semibold text-lg tracking-wider drop-shadow-md">Scan QR</h1>
        <div className="w-11"></div> 
      </div>

      {/* Global Styles */}
      <style>{`
        #reader { width: 100% !important; height: 100vh !important; background: black; position: relative; overflow: hidden; }
        #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; position: absolute; top: 0; left: 0; transform: ${facingMode === 'user' ? 'scaleX(-1)' : 'none'} !important; }
        #qr-shaded-region { border-color: rgba(0, 0, 0, 0.7) !important; z-index: 10 !important; }
        
        .flip-animate { animation: flip-cam 0.6s ease-in-out; }
        @keyframes flip-cam {
          0% { transform: perspective(800px) rotateY(0deg) scale(1); opacity: 1; }
          50% { transform: perspective(800px) rotateY(90deg) scale(0.8); opacity: 0.2; }
          100% { transform: perspective(800px) rotateY(0deg) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Scanner Container with Flip Animation */}
      <div className={`w-full h-full ${isFlipping ? 'flip-animate' : ''}`}>
        <div id="reader" className="w-full h-full flex items-center justify-center"></div>
      </div>

      {/* Zoom Slider */}
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
        <span className="text-white text-xs font-bold">1x</span>
        <input 
          type="range" min="1" max="5" step="0.1" value={zoom} onChange={handleZoom} 
          className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#2563eb]" 
        />
        <span className="text-white text-xs font-bold">5x</span>
      </div>

      {/* Bottom Hardware Dock */}
      <div className="absolute bottom-12 left-0 w-full flex justify-center gap-10 z-50">
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 bg-black/40 backdrop-blur-lg border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          <span className="text-white text-xs font-medium drop-shadow-md">Gallery</span>
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleGalleryUpload} />
        </div>

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
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl animate-fade-in-up whitespace-nowrap">
          <p className="text-white font-medium text-sm tracking-wide">{message}</p>
        </div>
      )}
    </div>
  );
}