import AttendanceGraph from './AttendanceGraph';

export default function StudentStatsTab({
  studentInfo,
  attendanceData,
  isLoadingStats,
  calYear,
  calMonth,
  isDarkMode,
  onMonthChange
}) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const panelClass = isDarkMode ? "bg-[#161b26] border-gray-800" : "bg-white border-gray-200";

  const presentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key);
    return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'present';
  }).length;

  const absentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key);
    return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'absent';
  }).length;
  
  const totalSessions = presentCount + absentCount;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 md:h-12 rounded-md bg-transparent"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];

      let styleClass = isDarkMode ? 'bg-[#1e293b]/50 text-gray-300' : 'bg-gray-50 text-gray-600';
      if (status === 'present') {
        styleClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]';
      } else if (status === 'absent') {
        styleClass = 'bg-red-500/10 text-red-500 border border-red-500/30 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]';
      }

      days.push(
        <div key={day} className={`h-10 md:h-12 flex items-center justify-center text-sm font-bold rounded-md cursor-default ${styleClass}`}>
          {day}
        </div>
      );
    }
    
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="h-10 md:h-12 rounded-md bg-transparent"></div>);
    }

    return days;
  };

  return (
    <div className="w-full flex flex-col h-full relative z-10 max-w-5xl mx-auto">
      <div className={`flex flex-col p-6 md:p-10 rounded-xl border w-full shadow-lg ${panelClass}`}>

        {/* Profile Header */}
        <div className={`border-b pb-6 md:pb-8 mb-6 md:mb-8 flex items-start gap-4 md:gap-6 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-md bg-slate-400 overflow-hidden shrink-0 border border-transparent shadow-sm">
            <img
              src={studentInfo.profileImage || `https://ui-avatars.com/api/?name=${studentInfo.name}&background=ea580c&color=fff&font-size=0.4`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="pt-1 md:pt-2 flex flex-col justify-center">
            <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>USER PROFILE</p>
            <h3 className={`text-xl md:text-3xl font-extrabold uppercase truncate tracking-wide ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {studentInfo?.name || "Student"}
            </h3>
          </div>
        </div>

        {/* Body Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left Side: Stats & Account Details */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4 shrink-0">
            <div>
              <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>VERIFIED ATTENDANCE</p>
              <p className={`font-bold text-4xl md:text-5xl ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>{presentCount}</p>
            </div>
            
            <div className="mt-2">
              <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>MISSED SESSIONS</p>
              <p className={`font-bold text-4xl md:text-5xl ${isDarkMode ? 'text-red-500' : 'text-red-600'}`}>{absentCount}</p>
            </div>
            
            <div className={`p-4 md:p-5 mt-2 rounded-lg border shadow-sm ${isDarkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-[10px] font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>CALCULATED METRIC</p>
              <p className={`font-bold text-lg md:text-xl ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {totalSessions > 0
                  ? `${attendanceRate}% Compliance`
                  : 'No Data'}
              </p>
            </div>

            {/* Account Details Box */}
            <div className={`p-4 md:p-5 rounded-lg border shadow-sm flex flex-col gap-4 mt-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-[10px] font-mono uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Account Details</p>
              <div className="flex flex-col gap-3">
                
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                  <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {studentInfo?.email ? studentInfo.email : <span className="opacity-50 italic font-normal text-xs">Missing (Please Log Out & Log In)</span>}
                  </p>
                </div>
                
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stream & Section</p>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {studentInfo?.stream && studentInfo.stream !== 'Unassigned' 
                      ? `${studentInfo.stream} ${studentInfo.section && studentInfo.section !== 'Unassigned' ? `- Sec ${studentInfo.section}` : ''}`
                      : <span className="opacity-50 italic font-normal text-xs">Missing (Please Log Out & Log In)</span>}
                  </p>
                </div>
                
              </div>
            </div>
          </div>

          {/* Right Side: Calendar & Graph */}
          <div className="flex-1 overflow-x-hidden flex flex-col gap-8">
            
            {/* Calendar Section */}
            <div className="w-full bg-transparent">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => onMonthChange(-1)} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}>
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <span className={`font-bold text-sm md:text-base uppercase tracking-widest ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {monthNames[calMonth]} {calYear}
                </span>
                <button onClick={() => onMonthChange(1)} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}>
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>

              {isLoadingStats ? (
                <div className={`h-64 flex items-center justify-center font-bold text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Retrieving log...</div>
              ) : (
                <div className="w-full">
                  <div className={`grid grid-cols-7 gap-2 md:gap-3 mb-3 text-center text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {renderCalendar()}
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Graph */}
            {!isLoadingStats && (
              <div className="w-full mt-2">
                <AttendanceGraph 
                  attendanceData={attendanceData}
                  calYear={calYear}
                  calMonth={calMonth}
                  isDarkMode={isDarkMode}
                  attendanceRate={attendanceRate}
                />
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}