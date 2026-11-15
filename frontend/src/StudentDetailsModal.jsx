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
  
  // Load existing stream or fallback to first stream in edit mode
  const [editForm, setEditForm] = useState({ 
    name: student.name, 
    email: student.email, 
    password: '',
    stream: student.stream || STREAMS[0] 
  });
  
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
      const payload = { name: editForm.name, email: editForm.email, stream: editForm.stream };
      if (editForm.password) payload.password = editForm.password;
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast("Student updated!");
        setIsEditing(false);
        setCurrentStudent({ ...currentStudent, name: editForm.name, email: editForm.email, stream: editForm.stream });
        onUpdate();
      } else showToast("Failed to update");
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
        showToast("Device unlocked.");
        setCurrentStudent({ ...currentStudent, deviceId: null });
        onUpdate();
      }
    } catch (error) {}
  };

  const handleDeleteAttendanceOnly = async () => {
    if (!window.confirm("Wipe ALL records?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}/records`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Records wiped.");
        setAttendanceData({});
        setShowDeleteModal(false);
      }
    } catch (error) {}
  };

  const handleRemoveStudent = async () => {
    if (!window.confirm("CRITICAL: Delete student?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Student removed.");
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
        showToast("Failed to update date.");
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
      
      let styleClass = isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-900/70 hover:text-orange-950'; 
      if (status === 'present') {
        styleClass = 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] rounded-xl';
      } else if (status === 'absent') {
        styleClass = 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] rounded-xl';
      }

      days.push(
        <div key={day} onClick={() => handleDayClick(day)} className={`h-10 flex items-center justify-center text-sm font-bold cursor-pointer transition-all ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;
  const glassInput = isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-white/60 border-orange-200/50 text-orange-950';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in-up ${isDarkMode ? 'bg-black/60' : 'bg-black/20'}`}>
      
      <div className={`border rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh] backdrop-blur-3xl ${isDarkMode ? 'bg-[#191e28]/95 border-white/10' : 'bg-white/95 border-orange-200'}`}>
        
        <button onClick={onClose} className={`absolute top-6 right-6 p-2 rounded-full transition-colors z-10 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-400 hover:text-orange-600'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className={`p-8 border-b flex items-start gap-5 relative ${isDarkMode ? 'border-white/10' : 'border-orange-100'}`}>
          
          <button onClick={() => setIsEditing(!isEditing)} className={`absolute top-6 right-16 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
            {isEditing ? 'Cancel Edit' : 'Edit Info'}
          </button>

          <div className="w-16 h-16 rounded-full bg-slate-400 overflow-hidden shrink-0 border-2 border-transparent mt-2">
             <img src={`https://ui-avatars.com/api/?name=${currentStudent.name}&background=ea580c&color=fff&font-size=0.4`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          
          <div className="pt-2 w-full pr-16">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-3 w-full animate-fade-in-up">
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Student Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:outline-none border ${glassInput}`} />
                </div>
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Email Address</label>
                  <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:outline-none border ${glassInput}`} />
                </div>
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Stream</label>
                  <div className="relative">
                    <select 
                      value={editForm.stream} 
                      onChange={e => setEditForm({ ...editForm, stream: e.target.value })} 
                      className={`w-full appearance-none rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:outline-none border pr-8 truncate ${glassInput}`}
                    >
                      {STREAMS.map(stream => (
                        <option key={stream} value={stream} className="text-black bg-white">{stream}</option>
                      ))}
                    </select>
                    <svg className={`w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Reset Password</label>
                  <input type="text" placeholder="Leave blank to keep current..." value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none border ${glassInput}`} />
                </div>
                <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors mt-2 shadow-sm">Save Changes</button>
              </form>
            ) : (
              <div className="animate-fade-in-up">
                <h3 className={`text-2xl font-extrabold tracking-wide uppercase truncate ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{currentStudent.name}</h3>
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-400' : 'text-orange-700/80'}`}>{currentStudent.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex flex-col sm:flex-row gap-8">
          
          <div className="w-full sm:w-1/3 flex flex-col gap-6">
            <div>
              <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50'}`}>Stream</p>
              <p className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{currentStudent.stream || 'Unassigned'}</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50'}`}>Status</p>
              <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{currentStudent.deviceId ? 'Locked to Device' : 'Active / Unlocked'}</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDarkMode ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>Total Present</p>
              <p className={`font-extrabold text-2xl ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{presentCount}</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDarkMode ? 'text-red-500/70' : 'text-red-600/70'}`}>Total Absent</p>
              <p className={`font-extrabold text-2xl ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{absentCount}</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => shiftMonth(-1)} className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-900/40 hover:text-orange-950'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
              <span className={`font-bold text-lg min-w-[120px] text-center ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{monthNames[calMonth]} {calYear}</span>
              <button onClick={() => shiftMonth(1)} className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-900/40 hover:text-orange-950'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
            </div>
            
            {isModalLoading ? (
              <div className={`h-48 flex items-center justify-center font-bold ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50'}`}>Loading...</div>
            ) : (
              <div>
                <div className={`grid grid-cols-7 gap-1 mb-2 text-center text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
              </div>
            )}
          </div>
        </div>

        <div className={`p-8 border-t flex gap-4 shrink-0 mt-auto items-center justify-center ${isDarkMode ? 'border-white/10' : 'border-orange-100'}`}>
          <button onClick={handleResetDevice} disabled={!currentStudent.deviceId} className={`px-8 py-3 rounded-xl font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed border active:scale-95 flex items-center gap-2 ${isDarkMode ? 'bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10' : 'bg-transparent border-emerald-500/50 text-emerald-600 hover:bg-emerald-50'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Unlock Device
          </button>
          
          <button onClick={() => setShowDeleteModal(true)} className={`px-8 py-3 rounded-xl font-bold transition-all text-sm border active:scale-95 flex items-center gap-2 ${isDarkMode ? 'bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10' : 'bg-transparent border-red-500/50 text-red-600 hover:bg-red-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Deletes
          </button>
        </div>

        {showDeleteModal && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className={`border rounded-3xl w-full max-w-sm p-8 text-center ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Delete Data</h3>
              <p className={`text-sm mb-6 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Remove data for <span className="font-bold">{currentStudent?.name}</span>?</p>
              
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteAttendanceOnly} className={`w-full py-3 rounded-xl font-bold transition-all text-sm border active:scale-95 ${isDarkMode ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-white text-orange-700 border-orange-200'}`}>
                  Clear Attendance
                </button>
                <button onClick={handleRemoveStudent} className="w-full py-3 rounded-xl font-bold transition-all text-sm bg-red-600 text-white shadow-md active:scale-95">
                  Delete Student
                </button>
                <button onClick={() => setShowDeleteModal(false)} className={`w-full py-3 rounded-xl font-bold transition-all text-sm mt-2 active:scale-95 ${isDarkMode ? 'bg-[#1e293b] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
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