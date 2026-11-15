import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTheme } from './ThemeContext';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const { isDarkMode } = useTheme();
  const [toastMessage, setToastMessage] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
          <div className={`border shadow-[0_8px_30px_rgba(249,115,22,0.15)] rounded-full px-6 py-3 flex items-center gap-3 ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-[#fffaf0] border-orange-200'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#0b0f19]' : 'bg-orange-100'}`}>
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className={`font-bold text-sm tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{toastMessage}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};