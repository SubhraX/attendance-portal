import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toastMessage, setToastMessage] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    
    // Clear any existing timers so rapid clicks don't dismiss the new toast early
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* GLOBAL TOAST UI */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
          <div className="bg-[#fffaf0] border border-orange-200 shadow-[0_8px_30px_rgba(249,115,22,0.15)] rounded-full px-6 py-3 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-orange-950 font-bold text-sm tracking-wide">{toastMessage}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};