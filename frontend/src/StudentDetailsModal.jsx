import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import { STREAMS } from './FacultyRecords';

export default function StudentDetailsModal({ student, onClose, onUpdate }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [currentStudent, setCurrentStudent] = useState(student);
  
  const [isModalLoading, setIsModalLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editForm, setEditForm] = useState({ 
    name: student.name, 
    email: student.email, 
    password: '',
    stream: student.stream || STREAMS[0] 
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
      const payload = { name: editForm.name, email: editForm.email, stream: editForm.stream };
      if (editForm.password) payload.password = editForm.password;
      
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast("Record updated successfully.");
        setIsEditing(false);
        setCurrentStudent({ ...currentStudent, name: editForm.name, email: editForm.email, stream: editForm.stream });
        onUpdate();
      } else {
        showToast("Update failed.");
      }
    } catch (error) {
      console.error("Error updating student:", error);
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

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className={`h-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}></div>);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];
      
      let styleClass = isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'; 
      if (status === 'present') styleClass = 'bg-green-600 text-white font-bold';
      else if (status === 'absent') styleClass = 'bg-red-600 text-white font-bold';

      days.push(
        <div key={day} onClick={() => handleDayClick(day)} className={`h-8 flex items-center justify-center text-xs border-r border-b cursor-pointer ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;
  
  const inputClass = `w-full border px-2 py-1.5 text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`;
  const modalBg = isDarkMode ? 'bg-gray-900 border border-gray-700 text-gray-100' : 'bg-white border border-gray-300 text-gray-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-sm shadow-xl overflow-hidden ${modalBg}`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Student Record: {currentStudent.name}</h3>
          <button onClick={onClose} className="text-xl leading-none font-bold text-gray-500 hover:text-black dark:hover:text-white">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row gap-6">
          
          {/* Left Column (Info) */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className={`border p-3 rounded-sm ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase font-bold text-gray-500">Profile Details</span>
                <button onClick={() => setIsEditing(!isEditing)} className="text-[10px] text-blue-600 hover:underline">{isEditing ? 'Cancel Edit' : 'Edit'}</button>
              </div>
              
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} placeholder="Name" />
                  <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} placeholder="Email" />
                  <select value={editForm.stream} onChange={e => setEditForm({ ...editForm, stream: e.target.value })} className={inputClass}>
                    {STREAMS.map(stream => <option key={stream} value={stream}>{stream}</option>)}
                  </select>
                  <input type="text" placeholder="New Password (Optional)" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className={inputClass} />
                  <button type="submit" className="bg-blue-600 text-white text-xs py-1.5 mt-1 rounded-sm">Save</button>
                </form>
              ) : (
                <div className="text-sm flex flex-col gap-1">
                  <p><strong>Name:</strong> {currentStudent.name}</p>
                  <p><strong>Email:</strong> {currentStudent.email}</p>
                  <p><strong>Stream:</strong> {currentStudent.stream || 'N/A'}</p>
                  <p><strong>Hardware Status:</strong> {currentStudent.deviceId ? 'Locked' : 'Unlocked'}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`border p-2 rounded-sm text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className="text-[10px] uppercase text-gray-500">Present</p>
                <p className="text-xl font-bold text-green-600">{presentCount}</p>
              </div>
              <div className={`border p-2 rounded-sm text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className="text-[10px] uppercase text-gray-500">Absent</p>
                <p className="text-xl font-bold text-red-600">{absentCount}</p>
              </div>
            </div>

            <div className={`border p-3 rounded-sm flex flex-col gap-2 mt-auto ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <span className="text-xs uppercase font-bold text-gray-500">Administrative Actions</span>
              <button onClick={handleResetDevice} disabled={!currentStudent.deviceId} className="w-full text-xs py-1.5 border border-gray-400 disabled:opacity-50 rounded-sm">Unlock Device</button>
              <button onClick={handleDeleteAttendanceOnly} className="w-full text-xs py-1.5 border border-red-400 text-red-600 rounded-sm">Clear Attendance</button>
              <button onClick={handleRemoveStudent} className="w-full text-xs py-1.5 bg-red-600 text-white rounded-sm">Delete Student</button>
            </div>
          </div>

          {/* Right Column (Calendar) */}
          <div className="w-full md:w-2/3 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => shiftMonth(-1)} className="px-2 py-1 text-xs border rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Prev</button>
              <span className="font-bold text-sm uppercase">{monthNames[calMonth]} {calYear}</span>
              <button onClick={() => shiftMonth(1)} className="px-2 py-1 text-xs border rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Next</button>
            </div>
            
            {isModalLoading ? (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500">Loading ledger...</div>
            ) : (
              <div className={`border-t border-l flex flex-col min-w-[300px] ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className={`h-8 flex items-center justify-center text-xs font-bold border-r ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {renderCalendar()}
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-500 mt-2 text-right">Click cells to manually override status.</p>
          </div>
        </div>

      </div>
    </div>
  );
}