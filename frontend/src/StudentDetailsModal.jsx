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
  const [animateGraph, setAnimateGraph] = useState(false);
  
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

  // Re-trigger SVG animation whenever the calendar month shifts
  useEffect(() => {
    setAnimateGraph(false);
    const timer = setTimeout(() => setAnimateGraph(true), 50);
    return () => clearTimeout(timer);
  }, [calMonth, calYear, currentStudent._id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const payload = { 
        name: editForm.name, 
        email: editForm.email, 
        stream: editForm.stream,
        section: editForm.section
      };
      
      if (editForm.password && editForm.password.trim() !== '') {
        payload.password = editForm.password;
      } else if (currentStudent.password) {
        payload.password = currentStudent.password;
      }
      
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
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: dateString, status: newStatus })
      });
      
      if (!res.ok) throw new Error("Sync failed");
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

  // Fixed Trend Calculation with Details Mapping
  const getMonthlyTrend = () => {
    const trend = [];
    const labels = [];
    const details = [];
    const now = new Date(calYear, calMonth, 1);
    
    let lastValid = 0; // Fixed: Default to 0% instead of 100%
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = targetMonth.getFullYear();
      const m = targetMonth.getMonth();
      labels.push(monthNames[m].substring(0, 3));
      
      let p = 0, t = 0;
      Object.entries(attendanceData).forEach(([dateStr, status]) => {
        const d = new Date(dateStr);
        if (d.getFullYear() === y && d.getMonth() === m && (status === 'present' || status === 'absent')) {
          t++;
          if (status === 'present') p++;
        }
      });
      
      if (t > 0) {
        const pct = Math.round((p / t) * 100);
        trend.push(pct);
        lastValid = pct;
        details.push(`${p}/${t} cls`);
      } else {
        trend.push(lastValid);
        details.push(`0/0 cls`);
      }
    }
    
    return { data: trend, labels, details };
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={`h-10 rounded-md bg-transparent`}></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];
      
      let styleClass = isDarkMode ? 'bg-[#1e293b]/50 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-200'; 
      if (status === 'present') styleClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20';
      else if (status === 'absent') styleClass = 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20';

      days.push(
        <div key={day} onClick={() => handleDayClick(day)} className={`h-10 flex items-center justify-center text-sm font-medium rounded-md cursor-pointer transition-colors ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const inputClass = `w-full border px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${isDarkMode ? 'bg-[#0f172a] border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const modalBg = isDarkMode ? 'bg-[#121826] border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  const cardBg = isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-gray-50 border-gray-200';
  const labelClass = `text-[10px] font-semibold uppercase tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
  const customScrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDarkMode ? '[&::-webkit-scrollbar-thumb]:bg-gray-700' : '[&::-webkit-scrollbar-thumb]:bg-gray-300'}`;

  // SVG Chart Dimensions & Data
  const trendInfo = getMonthlyTrend();
  const svgWidth = 600;
  const svgHeight = 170; // Increased to fit details below labels
  const paddingX = 40;
  const paddingY = 40; // Increased to fit tooltips above nodes
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY - 40; 
  
  const pointCoords = trendInfo.data.map((val, i) => {
    const x = paddingX + (i * (chartW / (trendInfo.data.length - 1)));
    const y = paddingY + chartH - (val / 100 * chartH);
    return { x, y };
  });
  
  const pathString = pointCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const areaString = `${pathString} L ${svgWidth - paddingX} ${svgHeight - 40} L ${paddingX} ${svgHeight - 40} Z`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4 md:p-8">
      <div className={`w-full max-w-[950px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${modalBg}`}>
        
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
        <div className={`flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 ${isDarkMode ? 'bg-[#121826]' : 'bg-white'}`}>
          
          {/* Left Column (Info & Actions) */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            
            {/* Details Card */}
            <div className={`border rounded-xl p-5 ${cardBg}`}>
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
                    <div className="w-1/2">
                      <select value={editForm.stream} onChange={e => setEditForm({ ...editForm, stream: e.target.value, section: STREAM_SECTIONS[e.target.value]?.[0] || 'Unassigned' })} className={inputClass}>
                        {STREAMS.map(stream => <option key={stream} value={stream}>{stream}</option>)}
                      </select>
                    </div>
                    <div className="w-1/2">
                      <select value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} className={inputClass}>
                        {STREAM_SECTIONS[editForm.stream]?.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="New Password (Optional)" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute inset-y-0 right-0 pr-2.5 flex items-center transition-colors ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPassword ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    </button>
                  </div>
                  
                  <button type="submit" className="bg-orange-600 text-white font-medium text-sm py-2 mt-2 rounded-lg hover:bg-orange-500 transition-colors">Save Changes</button>
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
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currentStudent.stream || 'Unassigned'} {currentStudent.section && currentStudent.section !== 'Unassigned' ? `- ${currentStudent.section}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className={labelClass}>Device Lock</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${currentStudent.deviceId ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                      {currentStudent.deviceId ? 'Enforced' : 'Unlocked'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`border rounded-xl p-4 flex flex-col justify-center ${cardBg}`}>
                <p className={labelClass}>Present</p>
                <p className="text-3xl font-bold text-emerald-500 leading-none">{presentCount}</p>
              </div>
              <div className={`border rounded-xl p-4 flex flex-col justify-center ${cardBg}`}>
                <p className={labelClass}>Absent</p>
                <p className="text-3xl font-bold text-red-500 leading-none">{absentCount}</p>
              </div>
            </div>

            {/* Actions Card */}
            <div className={`border rounded-xl p-5 mt-auto ${cardBg}`}>
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
          <div className={`w-full md:w-2/3 border rounded-xl p-6 flex flex-col ${cardBg}`}>
            
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
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>
            )}
            <p className={`text-[10px] mt-4 mb-6 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click any cell to manually toggle attendance status.</p>

            {/* Attendance Overview SVG Graph */}
            <div className={`mt-auto pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 18v-4h4v4H4zm6 0v-8h4v8h-4zm6 0V6h4v12h-4z"/>
                </svg>
                <h4 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Attendance Overview</h4>
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[400px]">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Horizontal Grid lines */}
                  {[0, 25, 50, 75, 100].map(line => {
                    const yPos = paddingY + chartH - (line/100 * chartH);
                    return (
                      <line key={line} x1={paddingX} y1={yPos} x2={svgWidth - paddingX} y2={yPos} stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />
                    );
                  })}

                  {/* Y Axis Labels */}
                  {[0, 50, 100].map(line => (
                    <text key={line} x={paddingX - 10} y={paddingY + chartH - (line/100 * chartH) + 4} fill={isDarkMode ? "#64748b" : "#94a3b8"} fontSize="10" textAnchor="end">
                      {line}%
                    </text>
                  ))}
                  
                  {/* Animated Gradient Area */}
                  {trendInfo.data.length > 1 && (
                    <path 
                      d={areaString} 
                      fill="url(#chartGradient)" 
                      style={{
                        opacity: animateGraph ? 1 : 0,
                        transition: 'opacity 1s ease-in-out',
                        transitionDelay: '0.2s'
                      }}
                    />
                  )}

                  {/* Animated Stroke Line */}
                  {trendInfo.data.length > 1 && (
                    <path 
                      d={pathString} 
                      fill="none" 
                      stroke="#f43f5e" 
                      strokeWidth="2.5" 
                      strokeDasharray={2000}
                      strokeDashoffset={animateGraph ? 0 : 2000}
                      style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  )}
                  
                  {/* Data Points, Vertical Guidelines, & X Axis Labels (Staggered Fade In) */}
                  {pointCoords.map((pt, i) => (
                    <g 
                      key={i}
                      style={{
                        opacity: animateGraph ? 1 : 0,
                        transition: 'opacity 0.5s ease-out',
                        transitionDelay: `${0.4 + (i * 0.1)}s` 
                      }}
                    >
                      {/* Vertical Dashed Guideline */}
                      <line x1={pt.x} y1={paddingY} x2={pt.x} y2={svgHeight - 40} stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="0.5" strokeDasharray="4 4" />
                      
                      {/* Node Circle */}
                      <circle cx={pt.x} cy={pt.y} r="4.5" fill={isDarkMode ? "#1e293b" : "#ffffff"} stroke="#f43f5e" strokeWidth="2.5" />
                      
                      {/* Month Label */}
                      <text x={pt.x} y={svgHeight - 22} fill={isDarkMode ? "#94a3b8" : "#64748b"} fontSize="10" textAnchor="middle" fontWeight="bold">
                        {trendInfo.labels[i]}
                      </text>
                      
                      {/* Class Details (e.g. 5/6 cls) */}
                      <text x={pt.x} y={svgHeight - 8} fill={isDarkMode ? "#64748b" : "#94a3b8"} fontSize="8" textAnchor="middle">
                        {trendInfo.details[i]}
                      </text>

                      {/* Percentage Tooltip Above Node */}
                      <g transform={`translate(${pt.x}, ${pt.y - 18})`}>
                        <rect x="-16" y="-12" width="32" height="15" rx="4" fill={isDarkMode ? "#334155" : "#475569"} />
                        <text x="0" y="0" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                          {trendInfo.data[i]}%
                        </text>
                      </g>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}