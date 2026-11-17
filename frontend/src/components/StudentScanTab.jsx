import { useNavigate } from 'react-router-dom';

export default function StudentScanTab({ isDarkMode }) {
  const navigate = useNavigate();
  const panelClass = isDarkMode ? "bg-[#161b26] border-gray-800" : "bg-white border-gray-200";

  return (
    <div className="w-full mx-auto flex items-center justify-center h-full mt-6 md:mt-0">
      <div className={`flex flex-col items-center justify-center p-8 md:p-14 rounded-xl border w-full max-w-lg text-center ${panelClass}`}>
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-md flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
          <svg className={`w-8 h-8 md:w-10 md:h-10 ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
        </div>

        <h2 className={`text-xl md:text-2xl font-bold tracking-wide mb-3 uppercase ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Session Verification</h2>
        <p className={`text-xs md:text-sm font-medium mb-8 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Initialize scanner to verify active cryptographic token. Campus network verification may be enforced by the instructor.
        </p>

        <button
          onClick={() => navigate('/scanner')}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-md font-bold w-full text-sm md:text-base flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Initialize Scanner
        </button>
      </div>
    </div>
  );
}