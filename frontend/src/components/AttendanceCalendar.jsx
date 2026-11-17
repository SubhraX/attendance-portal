export default function AttendanceCalendar({
  studentId,
  attendanceData = {},
  setAttendanceData,
  calYear,
  setCalYear,
  calMonth,
  setCalMonth,
  isDarkMode,
  isModalLoading,
  onMonthChange,
  onDayClick
}) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const shiftMonth = (offset) => {
    let newMonth = calMonth + offset;
    let newYear = calYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    else if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setCalMonth(newMonth); setCalYear(newYear);
  };

  const handleDayClick = async (day) => {
    const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const currentStatus = attendanceData[dateString];
    let newStatus = !currentStatus ? 'present' : currentStatus === 'present' ? 'absent' : 'clear';

    setAttendanceData(prev => {
      const updated = { ...prev };
      if (newStatus === 'clear') delete updated[dateString];
      else updated[dateString] = newStatus;
      return updated;
    });

    try {
      const token = localStorage.getItem('token');
      // Added await here
      await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${studentId}/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: dateString, status: newStatus })
      });
    } catch (error) {
      console.error("Error updating day status:", error);
      setAttendanceData(prev => {
        const reverted = { ...prev };
        if (currentStatus) reverted[dateString] = currentStatus;
        else delete reverted[dateString];
        return reverted;
      });
    }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];

    // Pad start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 rounded-md bg-transparent"></div>);
    }

    // Render actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];
      let styleClass = isDarkMode ? 'bg-[#1e293b]/50 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-200';
      if (status === 'present') styleClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]';
      else if (status === 'absent') styleClass = 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]';
      
      days.push(
        <div 
          key={day} 
          onClick={() => {
            // Use onDayClick prop if it exists, otherwise fall back to internal handler
            if (typeof onDayClick === 'function') {
                onDayClick(day);
            } else {
                handleDayClick(day);
            }
          }} 
          className={`h-10 flex items-center justify-center text-sm font-bold rounded-md cursor-pointer transition-colors ${styleClass}`}
        >
          {day}
        </div>
      );
    }

    // Pad end of month to force exactly 42 cells (6 rows)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="h-10 rounded-md bg-transparent"></div>);
    }

    return days;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => typeof onMonthChange === 'function' ? onMonthChange(-1) : shiftMonth(-1)} className={`p-1 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <span className={`font-bold text-sm uppercase tracking-widest ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{monthNames[calMonth]} {calYear}</span>
        <button onClick={() => typeof onMonthChange === 'function' ? onMonthChange(1) : shiftMonth(1)} className={`p-1 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      {isModalLoading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium animate-pulse">Syncing ledger...</div>
      ) : (
        <div className="w-full min-w-[300px]">
          <div className={`grid grid-cols-7 gap-2 mb-3 text-center text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>
      )}
      <p className={`text-[10px] mt-4 mb-6 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click any cell to manually toggle attendance status.</p>
    </>
  );
}