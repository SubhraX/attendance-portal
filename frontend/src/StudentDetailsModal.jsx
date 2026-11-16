import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { STREAMS, STREAM_SECTIONS } from './FacultyRecords';

export default function StudentDetailsModal({ student, onClose, onUpdate }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [currentStudent, setCurrentStudent] = useState(student);
  
  const [isModalLoading, setIsModalLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Graph States
  const [animateGraph, setAnimateGraph] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  
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

  // Trigger smooth line drawing animation when month changes
  useEffect(() => {
    setAnimateGraph(false);
    const timer = setTimeout(() => setAnimateGraph(true), 50);
    return () => clearTimeout(timer);
  }, [calMonth, calYear, currentStudent._id]);

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

  // Extract daily trend perfectly normalized for the viewed calendar month
  const getDailyTrend = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const data = [];
    let cumulativeP = 0;
    let cumulativeT = 0;
    let lastPct = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateStr] || 'none';
      
      if (status === 'present') { cumulativeP++; cumulativeT++; }
      else if (status === 'absent') { cumulativeT++; }
      
      const pct = cumulativeT > 0 ? Math.round((cumulativeP / cumulativeT) * 100) : lastPct;
      lastPct = pct;
      
      data.push({ label: String(day), status, pct });
    }

    // Normalize to exactly 31 items. This guarantees the SVG 'd' paths always have the exact same 
    // number of anchors so they morph flawlessly between months, even if one month has 28 days and another has 31.
    const normalizedData = [];
    for (let i = 0; i < 31; i++) {
      if (i < data.length) {
        normalizedData.push(data[i]);
      } else {
        normalizedData.push({ ...data[data.length - 1], isHidden: true }); 
      }
    }
    
    return normalizedData;
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10 rounded-md bg-transparent"></div>);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];
      let styleClass = isDarkMode ? 'bg-[#1e293b]/50 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-200'; 
      if (status === 'present') styleClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[inset_0_0_8px_rgba(16,185,129,0.15)]';
      else if (status === 'absent') styleClass = 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]';
      days.push(<div key={day} onClick={() => handleDayClick(day)} className={`h-10 flex items-center justify-center text-sm font-bold rounded-md cursor-pointer transition-colors ${styleClass}`}>{day}</div>);
    }
    return days;
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const inputClass = `w-full border px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${isDarkMode ? 'bg-[#0f172a] border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const modalBg = isDarkMode ? 'bg-[#121826] border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  const cardBg = isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-gray-50 border-gray-200';
  const labelClass = `text-[10px] font-semibold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const customScrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-gray-600/80`;

  // Stats for Currently Viewed Month
  const presentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key); return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'present';
  }).length;
  const absentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key); return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'absent';
  }).length;
  const totalSessions = presentCount + absentCount;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  // SVG Chart Setup (Fixed size, responsive scale down)
  const trendData = getDailyTrend();
  const svgWidth = 800; 
  const svgHeight = 170; 
  const paddingX = 25;
  const paddingY = 40; 
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY - 30; 
  
  const pointCoords = trendData.map((d, i) => {
    const x = paddingX + (i * (chartW / (trendData.length - 1 || 1)));
    const y = paddingY + chartH - (d.pct / 100 * chartH);
    return { x, y, ...d };
  });
  
  const pathString = pointCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const areaString = `${pathString} L ${svgWidth - paddingX} ${svgHeight - 30} L ${paddingX} ${svgHeight - 30} Z`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`w-full max-w-[1000px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${modalBg}`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {getInitials(currentStudent.name)}
            </div>
            <h3 className="text-base font-bold uppercase tracking-widest">Student Record</h3>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 ${isDarkMode ? 'bg-[#121826]' : 'bg-white'} ${customScrollbar}`}>
          
          {/* Left Column (Info & Actions) */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            
            <div className={`border rounded-xl p-5 shadow-sm ${cardBg}`}>
              <div className="flex justify-between items-center mb-4">
                <span className={labelClass}>Profile Details</span>
                <button onClick={() => setIsEditing(!isEditing)} className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-orange-500 hover:text-orange-400' : 'text-orange-600 hover:text-orange-700'}`}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} placeholder="Name" />
                  <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} placeholder="Email" />
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
                  <button type="submit" className="bg-orange-600 text-white font-medium text-sm py-2 mt-2 rounded-lg hover:bg-orange-500">Save Changes</button>
                </form>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <span className={labelClass}>Name</span>
                    <span className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentStudent.name}</span>
                  </div>
                  <div>
                    <span className={labelClass}>Email</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentStudent.email}</span>
                  </div>
                  <div>
                    <span className={labelClass}>Stream & Section</span>
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentStudent.stream} - {currentStudent.section}</span>
                  </div>
                </div>
              )}
            </div>

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
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => shiftMonth(-1)} className={`p-1 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <span className={`font-bold text-sm uppercase tracking-widest ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{monthNames[calMonth]} {calYear}</span>
              <button onClick={() => shiftMonth(1)} className={`p-1 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
            
            {/* Calendar Grid */}
            {isModalLoading ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium animate-pulse">Syncing ledger...</div>
            ) : (
              <div className="w-full min-w-[300px]">
                <div className={`grid grid-cols-7 gap-2 mb-3 text-center text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>
            )}
            <p className={`text-[10px] mt-4 mb-6 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click any cell to manually toggle attendance status.</p>

            {/* Attendance SVG Graph */}
            <div className={`mt-auto pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 18v-4h4v4H4zm6 0v-8h4v8h-4zm6 0V6h4v12h-4z"/>
                  </svg>
                  <h4 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Daily Trend</h4>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall</span>
                  <span className={`text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{attendanceRate}%</span>
                </div>
              </div>

              {/* Scalable Container for fitting days perfectly */}
              <div className="w-full overflow-hidden rounded-lg">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(line => {
                    const yPos = paddingY + chartH - (line/100 * chartH);
                    return <line key={line} x1={paddingX} y1={yPos} x2={svgWidth - paddingX} y2={yPos} stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />;
                  })}

                  {/* Y Axis Labels */}
                  {[0, 50, 100].map(line => (
                    <text key={line} x={paddingX - 10} y={paddingY + chartH - (line/100 * chartH) + 4} fill={isDarkMode ? "#64748b" : "#94a3b8"} fontSize="10" textAnchor="end" className="select-none">
                      {line}%
                    </text>
                  ))}
                  
                  {/* SMOOTH MORPHING */}
                  {pointCoords.length > 0 && (
                    <>
                      <path 
                        d={areaString} 
                        fill="url(#chartGradient)" 
                        style={{
                          opacity: animateGraph ? 1 : 0,
                          transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s ease'
                        }}
                      />
                      <path 
                        d={pathString} 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="2" 
                        strokeDasharray={3000}
                        strokeDashoffset={animateGraph ? 0 : 3000}
                        style={{ 
                          transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      />
                    </>
                  )}
                  
                  {/* Data Points */}
                  {pointCoords.map((pt, i) => {
                    if (pt.isHidden) return null;
                    
                    // True Green and Red representation based on attendance status
                    const isPresent = pt.status === 'present';
                    const isAbsent = pt.status === 'absent';
                    const isUnmarked = pt.status === 'none';
                    
                    const fillColor = isPresent ? '#10b981' : isAbsent ? '#ef4444' : (isDarkMode ? '#334155' : '#cbd5e1');
                    const strokeColor = isPresent ? '#047857' : isAbsent ? '#b91c1c' : 'transparent';
                    const radius = isUnmarked ? "2.5" : (hoveredNode === i ? "6" : "4.5");

                    return (
                      <g 
                        key={i}
                        style={{
                          opacity: animateGraph ? 1 : 0,
                          transition: 'opacity 0.4s ease-out',
                          transitionDelay: `${0.1 + (i * 0.02)}s` 
                        }}
                      >
                        {/* Day Label on X Axis */}
                        <text x={pt.x} y={svgHeight - 12} fill={isDarkMode ? "#94a3b8" : "#64748b"} fontSize="10" textAnchor="middle" fontWeight="bold" className="select-none" style={{ transition: 'all 0.5s ease' }}>
                          {pt.label}
                        </text>

                        {/* Visible Node Circle - Glides smoothly */}
                        <circle 
                          cx={pt.x} cy={pt.y} 
                          r={radius} 
                          fill={fillColor} 
                          stroke={strokeColor} 
                          strokeWidth="1.5" 
                          style={{ transition: 'cx 0.5s cubic-bezier(0.4, 0, 0.2, 1), cy 0.5s cubic-bezier(0.4, 0, 0.2, 1), r 0.3s ease', pointerEvents: 'none' }} 
                        />

                        {/* Hover Tooltip Group */}
                        <g style={{ 
                          transform: `translate(${pt.x}px, ${pt.y - 20}px)`, 
                          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out',
                          opacity: hoveredNode === i ? 1 : 0,
                          pointerEvents: 'none'
                        }}>
                          <rect x="-24" y="-14" width="48" height="18" rx="4" fill={isDarkMode ? "#334155" : "#475569"} className="drop-shadow-sm" />
                          <text x="0" y="-2" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                            {pt.pct}%
                          </text>
                        </g>

                        {/* Invisible Hit Area (makes hovering over points much easier) */}
                        <circle 
                          cx={pt.x} cy={pt.y} 
                          r="15" 
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseEnter={() => setHoveredNode(i)}
                          onMouseLeave={() => setHoveredNode(null)}
                          style={{ transition: 'cx 0.5s cubic-bezier(0.4, 0, 0.2, 1), cy 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}