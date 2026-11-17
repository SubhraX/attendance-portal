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

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];

      let styleClass = isDarkMode ? 'text-gray-500' : 'text-orange-900/40';
      if (status === 'present') {
        styleClass = 'bg-emerald-600 text-white rounded-md';
      } else if (status === 'absent') {
        styleClass = 'bg-red-600 text-white rounded-md';
      }

      days.push(
        <div key={day} className={`h-10 flex items-center justify-center text-sm font-bold cursor-default ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="w-full flex flex-col h-full relative z-10 max-w-4xl mx-auto">
      <div className={`flex flex-col p-6 md:p-10 rounded-xl border w-full ${panelClass}`}>

        <div className={`border-b pb-6 md:pb-8 mb-6 md:mb-8 flex items-start gap-4 md:gap-5 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-slate-400 overflow-hidden shrink-0 border border-transparent">
            <img
              src={studentInfo.profileImage || `https://ui-avatars.com/api/?name=${studentInfo.name}&background=ea580c&color=fff&font-size=0.4`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="pt-1 md:pt-2">
            <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>USER PROFILE</p>
            <h3 className={`text-xl md:text-2xl font-bold uppercase truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{studentInfo.name}</h3>
            <p className={`text-xs md:text-sm font-medium truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{studentInfo.email}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-10">
          <div className="w-full md:w-1/3 flex flex-col gap-6 md:gap-8">
            <div>
              <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>VERIFIED ATTENDANCE</p>
              <p className={`font-bold text-3xl md:text-4xl ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>{presentCount}</p>
            </div>
            <div>
              <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>MISSED SESSIONS</p>
              <p className={`font-bold text-3xl md:text-4xl ${isDarkMode ? 'text-red-500' : 'text-red-600'}`}>{absentCount}</p>
            </div>
            <div className={`p-4 rounded-md border mt-auto ${isDarkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-[10px] font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>CALCULATED METRIC</p>
              <p className={`font-bold text-base md:text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {presentCount + absentCount > 0
                  ? `${Math.round((presentCount / (presentCount + absentCount)) * 100)}% Compliance`
                  : 'No Data'}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center justify-between mb-6 min-w-[250px]">
              <button onClick={() => onMonthChange(-1)} className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></button>
              <span className={`font-bold text-sm md:text-base min-w-[120px] md:min-w-[140px] text-center uppercase ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{monthNames[calMonth]} {calYear}</span>
              <button onClick={() => onMonthChange(1)} className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></button>
            </div>

            {isLoadingStats ? (
              <div className={`h-48 flex items-center justify-center font-bold text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Retrieving log...</div>
            ) : (
              <div className="min-w-[250px]">
                <div className={`grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-3 text-center text-xs font-mono uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2">{renderCalendar()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}