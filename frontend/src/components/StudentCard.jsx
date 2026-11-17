export default function StudentCard({ student, index, isDarkMode, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-4 cursor-pointer transition-all group relative overflow-hidden flex flex-col shadow-lg backdrop-blur-md ${
        isDarkMode 
          ? 'bg-[#11161d]/80 border-white/10 hover:border-orange-500/50 hover:bg-[#1a2130]/90' 
          : 'bg-white/80 border-orange-200/50 hover:border-orange-400 hover:bg-white/95'
      }`}
    >
      {/* Device Lock Indicator Bar */}
      <div className={`absolute top-0 right-0 w-2 h-full transition-colors ${
        student.deviceId 
          ? 'bg-emerald-500/80 group-hover:bg-emerald-500' 
          : 'bg-orange-500/80 group-hover:bg-orange-500'
      }`}></div>
      
      {/* Index & Lock Icon */}
      <div className="flex items-center gap-1.5 mb-1">
        {student.deviceId ? (
          <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" ry="2" strokeWidth="2"></rect>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" ry="2" strokeWidth="2"></rect>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11V7a5 5 0 019.9-1"></path>
          </svg>
        )}
        <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>
          Student {index + 1}
        </p>
      </div>
      
      {/* Student Details */}
      <h3 className={`font-extrabold text-base truncate mb-0.5 transition-colors ${
        isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-orange-950 group-hover:text-orange-600'
      }`}>
        {student.name.toUpperCase()}
      </h3>
      <p className={`text-[11px] truncate font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>
        {student.email}
      </p>
      
      {/* Stream & Section Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wide ${
          isDarkMode 
            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
            : 'bg-orange-50 text-orange-700 border border-orange-200'
        }`}>
          {student.stream || 'Unassigned'}
        </span>
        
        {student.section && student.section !== 'Unassigned' && (
          <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wide ${
            isDarkMode 
              ? 'bg-gray-800 text-gray-300 border border-gray-700' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            Sec {student.section}
          </span>
        )}
      </div>
    </div>
  );
}