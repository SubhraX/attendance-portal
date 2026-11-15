import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';

export default function StudentDetailsModal({ student, onClose, onUpdate }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [currentStudent, setCurrentStudent] = useState(student);
  
  const [isModalLoading, setIsModalLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: student.name, email: student.email, password: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      } catch (error) {}
      setIsModalLoading(false);
    };
    fetchAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent._id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { name: editForm.name, email: editForm.email };
      if (editForm.password) payload.password = editForm.password;

      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast("Student updated successfully!");
        setIsEditing(false);
        setCurrentStudent({ ...currentStudent, name: editForm.name, email: editForm.email });
        onUpdate();
      } else showToast("Failed to update student");
    } catch (error) {}
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
        showToast("Device unlocked successfully.");
        setCurrentStudent({ ...currentStudent, deviceId: null });
        onUpdate();
      }
    } catch (error) {}
  };

  const handleDeleteAttendanceOnly = async () => {
    if (!window.confirm("Are you sure you want to wipe ALL attendance records for this student?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}/records`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Attendance records wiped completely.");
        setAttendanceData({});
        setShowDeleteModal(false);
      }
    } catch (error) {}
  };

  const handleRemoveStudent = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete this student and ALL their attendance records. Proceed?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Student and records removed.");
        onUpdate();
        onClose();
      }
    } catch (error) {}
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
    
    let newStatus;
    if (!currentStatus) newStatus = 'present';
    else if (currentStatus === 'present') newStatus = 'absent';
    else newStatus = 'clear'; 
    
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
      if (!res.ok) {
        showToast("Failed to update date manually.");
        setAttendanceData(prev => {
          const reverted = { ...prev };
          if (currentStatus) reverted[dateString] = currentStatus;
          else delete reverted[dateString];
          return reverted;
        });
      }
    } catch (error) {}
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];
      
      let styleClass = isDarkMode ? 'bg-[#0b0f19] border-[#1e293b] text-gray-500 hover:border-orange-500 hover:text-white' : 'bg-white border-orange-100 text-orange-800 hover:border-orange-400 hover:bg-orange-50'; 
      if (status === 'present') {
        styleClass = isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-emerald-50 text-emerald-600 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      } else if (status === 'absent') {
        styleClass = isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-red-50 text-red-600 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      }

      days.push(
        <div key={day} onClick={() => handleDayClick(day)} className={`h-10 rounded-lg border flex items-center justify-center text-sm font-bold cursor-pointer transition-all ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const inputClass = `w-full rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:outline-none border ${isDarkMode ? 'bg-[#0b0f19] border-[#1e293b] text-white' : 'bg-[#fffaf0] border-orange-200 text-orange-950 font-medium focus:ring-2 focus:ring-orange-500/20'}`;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up ${isDarkMode ? 'bg-black/80' : 'bg-black/40'}`}>
      <div className={`border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh] ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
        
        <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${isDarkMode ? 'text-gray-400 hover:text-white bg-[#0b0f19]' : 'text-orange-400 hover:text-orange-600 bg-orange-50'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className={`p-8 border-b relative ${isDarkMode ? 'border-[#1e293b] bg-gradient-to-b from-[#101524] to-[#151b2b]' : 'border-orange-100 bg-gradient-to-b from-orange-50/50 to-white'}`}>
          <button onClick={() => setIsEditing(!isEditing)} className={`absolute top-6 right-16 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
            {isEditing ? 'Cancel Edit' : 'Edit Info'}
          </button>
          
          <div className="flex items-center gap-5 mt-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-3xl shadow-inner shrink-0 ${isDarkMode ? 'bg-orange-500/20 text-orange-500' : 'bg-orange-100 text-orange-700'}`}>
              {currentStudent.name.charAt(0).toUpperCase()}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-3 w-full pr-2">
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Student Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Email Address</label>
                  <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Reset Password</label>
                  <input type="text" placeholder="Leave blank to keep current..." value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className={`${inputClass} focus:border-red-500`} />
                </div>
                <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors mt-2 shadow-sm">Save Changes</button>
              </form>
            ) : (
              <div>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{currentStudent.name}</h3>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-700'}`}>{currentStudent.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-4 px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-[#101524] border-[#1e293b]' : 'bg-white border-orange-200 shadow-sm'}`}>
              <button onClick={() => shiftMonth(-1)} className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-900/40 hover:text-orange-950'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
              <span className={`font-bold min-w-[120px] text-center ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{monthNames[calMonth]} {calYear}</span>
              <button onClick={() => shiftMonth(1)} className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-900/40 hover:text-orange-950'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
            </div>
            <div className={`hidden sm:flex gap-3 text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Absent</span>
            </div>
          </div>

          {isModalLoading ? (
            <div className={`h-48 flex items-center justify-center font-bold ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50'}`}>Loading calendar...</div>
          ) : (
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-[#101524] border-[#1e293b]' : 'bg-[#fffaf0] border-orange-200'}`}>
              <div className={`grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold uppercase ${isDarkMode ? 'text-gray-500' : 'text-orange-900/60'}`}>
                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
              </div>
              <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
              <p className={`text-center text-xs mt-4 font-medium ${isDarkMode ? 'text-gray-500' : 'text-orange-900/60'}`}>Tap a day to toggle: <span className={isDarkMode ? 'text-emerald-500 font-bold' : 'text-emerald-600 font-bold'}>Present</span> ➔ <span className="text-red-500 font-bold">Absent</span> ➔ <span className={isDarkMode ? 'text-gray-400 font-bold' : 'text-orange-900/40 font-bold'}>Clear</span></p>
            </div>
          )}
        </div>

        <div className={`p-6 border-t flex gap-4 shrink-0 mt-auto ${isDarkMode ? 'border-[#1e293b] bg-[#101524]' : 'border-orange-100 bg-orange-50/50'}`}>
          <button onClick={handleResetDevice} disabled={!currentStudent.deviceId} className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed border active:scale-95 ${isDarkMode ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20' : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50 shadow-sm'}`}>
            {currentStudent.deviceId ? 'Unlock Device' : 'Device Unlocked'}
          </button>
          <button onClick={() => setShowDeleteModal(true)} className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm border active:scale-95 ${isDarkMode ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
            Delete Data
          </button>
        </div>

        {showDeleteModal && (
          <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up ${isDarkMode ? 'bg-black/80' : 'bg-black/40'}`}>
            <div className={`border rounded-3xl w-full max-w-md shadow-2xl p-8 relative flex flex-col text-center ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-100'}`}>
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Delete Data</h3>
              <p className={`text-sm mb-8 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>What data would you like to remove for <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{currentStudent?.name}</span>?</p>
              
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteAttendanceOnly} className={`w-full py-3.5 rounded-xl font-bold transition-all text-sm border active:scale-95 ${isDarkMode ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20' : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50 shadow-sm'}`}>
                  Clear Attendance
                </button>
                <button onClick={handleRemoveStudent} className="w-full py-3.5 rounded-xl font-bold transition-all text-sm bg-red-600 hover:bg-red-500 text-white shadow-md active:scale-95">
                  Delete Student
                </button>
                <button onClick={() => setShowDeleteModal(false)} className={`w-full py-3.5 rounded-xl font-bold transition-all text-sm mt-2 active:scale-95 ${isDarkMode ? 'bg-[#1e293b] text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}