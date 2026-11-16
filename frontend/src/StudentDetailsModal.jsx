import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { STREAMS, STREAM_SECTIONS } from './FacultyRecords';
import AttendanceGraph from './AttendanceGraph';

export default function StudentDetailsModal({ student, onClose, onUpdate }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [currentStudent, setCurrentStudent] = useState(student);

  const [isModalLoading, setIsModalLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(student.profileImage || null);

  const [editForm, setEditForm] = useState({
    name: student.name,
    email: student.email,
    password: '',
    stream: student.stream || STREAMS[0],
    section: student.section || STREAM_SECTIONS[STREAMS[0]][0]
  });

  const [attendanceData, setAttendanceData] = useState({});
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const records = await res.json();
        if (res.ok && Array.isArray(records)) {
          const dataMap = {};
          records.forEach(r => {
            const d = new Date(r.createdAt || r.date);
            if (!isNaN(d)) {
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              dataMap[dateStr] = r.status || 'present';
            }
          });
          setAttendanceData(dataMap);
        }
      } catch (error) {
        console.error("Failed to fetch student attendance:", error);
      } finally {
        setIsModalLoading(false);
      }
    };
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent._id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { name: editForm.name, email: editForm.email, stream: editForm.stream, section: editForm.section };
      if (editForm.password && editForm.password.trim() !== '') payload.password = editForm.password;
      else if (currentStudent.password) payload.password = currentStudent.password;

      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Record updated successfully.");
        setIsEditing(false);
        setCurrentStudent({ ...currentStudent, name: editForm.name, email: editForm.email, stream: editForm.stream, section: editForm.section });
        onUpdate();
      } else {
        const data = await res.json();
        showToast(data.message || "Update failed. Check required fields.");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      showToast("Network error. Could not update profile.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      // Add fetch call here to upload via FormData to your backend
      showToast("Profile image updated.");
    }
  };

  const handleResetDevice = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/reset-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId: currentStudent._id })
      });
      if (res.ok) {
        showToast("Device lock reset.");
        setCurrentStudent({ ...currentStudent, deviceId: null });
        onUpdate();
      }
    } catch (error) {
      console.error("Error unlocking device:", error);
    }
  };

  const handleDeleteAttendanceOnly = async () => {
    if (!window.confirm("Confirm: Wipe ALL attendance records for this student?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}/records`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Records cleared.");
        setAttendanceData({});
      }
    } catch (error) {
      console.error("Error deleting attendance:", error);
    }
  };

  const handleRemoveStudent = async () => {
    if (!window.confirm("Confirm: Delete student profile entirely?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Student deleted.");
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

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
      fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}/manual`, {
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
      days.push(<div key={day} onClick={() => handleDayClick(day)} className={`h-10 flex items-center justify-center text-sm font-bold rounded-md cursor-pointer transition-colors ${styleClass}`}>{day}</div>);
    }

    // Pad end of month to force exactly 42 cells (6 rows)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="h-10 rounded-md bg-transparent"></div>);
    }

    return days;
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const inputClass = `w-full border px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${isDarkMode ? 'bg-[#0f172a] border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const modalBg = isDarkMode ? 'bg-[#121826] border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  const cardBg = isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-gray-50 border-gray-200';
  const labelClass = `text-[10px] font-semibold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const customScrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-gray-600/80`;

  // Stats for Currently Viewed Month (Existing)
  const presentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key); return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'present';
  }).length;
  const absentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key); return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'absent';
  }).length;
  const totalSessions = presentCount + absentCount;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  // NEW: Calculate Trend (Current Month vs Previous Month)
  const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
  const prevYear = calMonth === 0 ? calYear - 1 : calYear;

  let prevMonthPresent = 0;
  let prevMonthAbsent = 0;
  Object.keys(attendanceData).forEach(key => {
    const d = new Date(key);
    if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
      if (attendanceData[key] === 'present') prevMonthPresent++;
      else if (attendanceData[key] === 'absent') prevMonthAbsent++;
    }
  });
  const prevTotal = prevMonthPresent + prevMonthAbsent;
  // If no previous month data, trend is 0
  const prevMonthRate = prevTotal > 0 ? Math.round((prevMonthPresent / prevTotal) * 100) : attendanceRate;

  const trendValue = attendanceRate - prevMonthRate;
  const isTrendUp = trendValue >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`w-full max-w-[1000px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${modalBg}`}>

        {/* Header */}
        <div className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className="text-base font-bold uppercase tracking-widest">Student Record</h3>
          <button onClick={onClose} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 ${isDarkMode ? 'bg-[#121826]' : 'bg-white'} ${customScrollbar}`}>

          {/* Left Column (Info & Actions) */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">

            {/* Top Profile Card (Read Only) */}
            <div className={`border rounded-xl p-6 flex items-center gap-5 shadow-sm ${cardBg}`}>
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-full bg-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(currentStudent.name)
                  )}
                </div>
              </div>
              <div className="flex flex-col text-left">
                <h4 className={`font-bold uppercase tracking-wide text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentStudent.name}
                </h4>

                {/* Dynamic Badges: Present and Absent Counters */}
                {(totalSessions > 0 || prevTotal > 0) && (
                  <div className="mt-2 inline-flex items-center gap-2">
                    {/* Up Counter (Present) */}
                    <span className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 15l7-7 7 7"></path>
                      </svg>
                      {presentCount}
                    </span>

                    {/* Down Counter (Absent) */}
                    <span className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full bg-red-500/10 text-red-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M19 9l-7 7-7-7"></path>
                      </svg>
                      {absentCount}
                    </span>
                  </div>
                )}

              </div>
            </div>

            {/* Account Details Card */}
            <div className={`border rounded-xl p-5 shadow-sm ${cardBg}`}>
              <div className="flex justify-between items-center mb-4">
                <span className={labelClass}>Account Details</span>
                <button onClick={() => setIsEditing(true)} className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-orange-500 hover:text-orange-400' : 'text-orange-600 hover:text-orange-700'}`}>
                  Edit Info
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <span className={labelClass}>Email</span>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentStudent.email}</span>
                </div>
                <div>
                  <span className={labelClass}>Stream & Section</span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentStudent.stream} - {currentStudent.section}</span>
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
                <button onClick={handleResetDevice} disabled={!currentStudent.deviceId} className={`w-full text-xs font-bold uppercase tracking-wide py-2.5 px-3 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-white'}`}>
                  Unlock Device
                </button>
                <button onClick={handleDeleteAttendanceOnly} className={`w-full text-xs font-bold uppercase tracking-wide py-2.5 px-3 border rounded-lg transition-colors ${isDarkMode ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
                  Clear Attendance
                </button>
                <button onClick={handleRemoveStudent} className="w-full text-xs font-bold uppercase tracking-wide py-2.5 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm border border-red-600">
                  Delete Student
                </button>
              </div>
            </div>

          </div>

          {/* Right Column (Calendar & Graph) */}
          <div className={`w-full md:w-2/3 border rounded-xl p-6 flex flex-col shadow-sm ${cardBg}`}>

            <div className="flex items-center justify-between mb-6">
              <button onClick={() => shiftMonth(-1)} className={`p-1 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <span className={`font-bold text-sm uppercase tracking-widest ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{monthNames[calMonth]} {calYear}</span>
              <button onClick={() => shiftMonth(1)} className={`p-1 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
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

            {/* SEPARATED COMPONENT: Attendance Graph */}
            <AttendanceGraph
              attendanceData={attendanceData}
              calYear={calYear}
              calMonth={calMonth}
              isDarkMode={isDarkMode}
              attendanceRate={attendanceRate}
            />

          </div>
        </div>

      </div>

      {/* NEW: Edit Info Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 border ${modalBg}`}>

            <h3 className="text-base font-bold uppercase tracking-widest mb-6 border-b pb-4 border-gray-200/20">
              Edit Student Info
            </h3>

            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden ring-4 ring-transparent group-hover:ring-orange-500/20 transition-all">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(editForm.name || currentStudent.name)
                  )}
                </div>
                <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} placeholder="Full Name" />
              <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} placeholder="Email Address" />

              <div className="flex gap-2">
                <select value={editForm.stream} onChange={e => setEditForm({ ...editForm, stream: e.target.value, section: STREAM_SECTIONS[e.target.value]?.[0] || 'Unassigned' })} className={inputClass}>
                  {STREAMS.map(stream => <option key={stream} value={stream}>{stream}</option>)}
                </select>
                <select value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} className={inputClass}>
                  {STREAM_SECTIONS[editForm.stream]?.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>

              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="New Password (Optional)" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200/20">
                <button type="button" onClick={() => setIsEditing(false)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>Cancel</button>
                <button type="submit" className="bg-orange-600 text-white font-medium text-sm px-6 py-2 rounded-lg hover:bg-orange-500 shadow-md">Save Changes</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}