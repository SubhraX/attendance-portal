export default function StudentProfileSidebar({
  student,
  profileImage,
  isDarkMode,
  prevTotal,
  prevMonthPresent,
  prevMonthAbsent,
  presentCount,
  absentCount,
  onEditClick,
  onResetDevice,
  onDeleteAttendance,
  onRemoveStudent
}) {
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const cardBg = isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-gray-50 border-gray-200';
  const labelClass = `text-[10px] font-semibold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="w-full md:w-1/3 flex flex-col gap-6">
      {/* Top Profile Card (Read Only) */}
      <div className={`border rounded-xl p-6 flex items-center gap-5 shadow-sm ${cardBg}`}>
        <div className="shrink-0">
          <div className="w-20 h-20 rounded-full bg-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(student.name)
            )}
          </div>
        </div>
        <div className="flex flex-col text-left py-1">
          <h4 className={`font-bold uppercase tracking-wide text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {student.name}
          </h4>

          <div className="h-5 mt-1.5 flex items-center">
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-0.5 font-bold text-xs tracking-wider ${prevTotal > 0 ? (isDarkMode ? 'text-[#34d399]' : 'text-emerald-600') : (isDarkMode ? 'text-gray-600' : 'text-gray-400')}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 19V5m0 0l-5 5m5-5l5 5"></path>
                </svg>
                {prevTotal > 0 ? Math.round((prevMonthPresent / prevTotal) * 100) : 0}%
              </span>

              <span className={`flex items-center gap-0.5 font-bold text-xs tracking-wider ${prevTotal > 0 ? (isDarkMode ? 'text-[#f87171]' : 'text-red-600') : (isDarkMode ? 'text-gray-600' : 'text-gray-400')}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 5v14m0 0l-5-5m5 5l5-5"></path>
                </svg>
                {prevTotal > 0 ? Math.round((prevMonthAbsent / prevTotal) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Card */}
      <div className={`border rounded-xl p-5 shadow-sm ${cardBg}`}>
        <div className="flex justify-between items-center mb-4">
          <span className={labelClass}>Account Details</span>
          <button onClick={onEditClick} className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-orange-500 hover:text-orange-400' : 'text-orange-600 hover:text-orange-700'}`}>
            Edit Info
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <span className={labelClass}>Email</span>
            <span className={`text-sm font-semibold break-all ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{student.email}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>Stream & Section</span>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{student.stream} - {student.section}</span>
            </div>
            <div>
              <span className={labelClass}>Admission Year</span>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{student.admissionYear || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Present/Absent Counters */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`border rounded-xl p-4 flex flex-col justify-center shadow-sm ${cardBg}`}>
          <p className={labelClass}>Present</p>
          <p className="text-3xl font-extrabold text-emerald-500 leading-none">{presentCount}</p>
        </div>
        <div className={`border rounded-xl p-4 flex flex-col justify-center shadow-sm ${cardBg}`}>
          <p className={labelClass}>Absent</p>
          <p className="text-3xl font-extrabold text-red-500 leading-none">{absentCount}</p>
        </div>
      </div>

      {/* Admin Controls */}
      <div className={`border rounded-xl p-5 mt-auto shadow-sm ${cardBg}`}>
        <span className={labelClass}>Admin Controls</span>
        <div className="flex flex-col gap-3 mt-4">
          <button onClick={onResetDevice} disabled={!student.deviceId} className={`w-full text-xs font-bold uppercase tracking-wide py-2.5 px-3 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-white'}`}>
            Unlock Device
          </button>
          <button onClick={onDeleteAttendance} className={`w-full text-xs font-bold uppercase tracking-wide py-2.5 px-3 border rounded-lg transition-colors ${isDarkMode ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
            Clear Attendance
          </button>
          <button onClick={onRemoveStudent} className="w-full text-xs font-bold uppercase tracking-wide py-2.5 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm border border-red-600">
            Delete Student
          </button>
        </div>
      </div>
    </div>
  );
}