import { useState, useEffect } from 'react';

export default function FacultyRecords() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });

  // Student Details Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceDates, setAttendanceDates] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  // Edit Student State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });

  // Calendar State
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students", error);
    }
    setLoading(false);
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regForm, role: 'student' })
      });
      if (res.ok) {
        alert("Student registered successfully!");
        setShowRegModal(false);
        setRegForm({ name: '', email: '', password: '' });
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      alert("Error connecting to server");
    }
  };

  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    setEditForm({ name: student.name, email: student.email, password: '' });
    setCalYear(new Date().getFullYear());
    setCalMonth(new Date().getMonth());
    setIsModalLoading(true);

    try {
      const token = localStorage.getItem('token');
      // Fetch attendance history for this specific student
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${student._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const records = await res.json();
      
      if (res.ok && Array.isArray(records)) {
        // Convert to an array of strictly formatted YYYY-MM-DD strings
        const datesArray = records.map(r => {
          const d = new Date(r.createdAt || r.date);
          if (isNaN(d)) return null;
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }).filter(Boolean); // Removes nulls
        
        console.log("Fetched Attendance Dates:", datesArray); // Verify in browser console
        setAttendanceDates(datesArray); // Save array to state
      } else {
        console.error("Backend Error or No Records:", records);
        setAttendanceDates([]);
      }
    } catch (error) {
      console.error("Failed to fetch student attendance", error);
      setAttendanceDates([]);
    }
    setIsModalLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { name: editForm.name, email: editForm.email };
      if (editForm.password) payload.password = editForm.password;

      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${selectedStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Student updated successfully!");
        setIsEditing(false);
        fetchStudents();
        setSelectedStudent({ ...selectedStudent, name: editForm.name, email: editForm.email });
      } else {
        alert("Failed to update student");
      }
    } catch (error) {
      alert("Error updating student");
    }
  };

  const handleResetDevice = async (studentId) => {
    if (!window.confirm(`Reset device lock for this student?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/reset-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId })
      });
      if (res.ok) {
        alert("Device unlocked successfully.");
        fetchStudents();
        setSelectedStudent({ ...selectedStudent, deviceId: null });
      }
    } catch (error) {
      alert('Failed to reset device');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete this student and ALL their attendance records. Proceed?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Student and records removed.");
        fetchStudents();
        setSelectedStudent(null);
      }
    } catch (error) {
      alert('Failed to remove student');
    }
  };

  // Calendar rendering logic
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const shiftMonth = (offset) => {
    let newMonth = calMonth + offset;
    let newYear = calYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Build local string to check against our Array
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Use .includes() since attendanceDates is now an Array
      const isPresent = attendanceDates.includes(dateString);
      
      days.push(
        <div key={day} className={`h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
          isPresent 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
            : 'bg-[#0b0f19] border border-[#1e293b] text-gray-500'
        }`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-full relative">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center mb-8 gap-4 bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Student Directory</h2>
          <p className="text-gray-400 text-sm mt-1">Manage enrollments and view visual attendance</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <button 
            onClick={() => setShowRegModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            Register Student
          </button>
          <div className="relative w-full sm:w-72">
            <svg className="w-5 h-5 absolute left-3 top-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f19] border border-[#1e293b] text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#5c98ff] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid of Student Cards */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading student directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up pb-10">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-2xl">No students found.</div>
          ) : (
            filteredStudents.map(student => (
              <div 
                key={student._id} 
                onClick={() => openStudentModal(student)}
                className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-5 hover:border-[#5c98ff] hover:shadow-[0_0_20px_rgba(92,152,255,0.1)] cursor-pointer transition-all group relative overflow-hidden flex flex-col"
              >
                <div className={`absolute top-0 right-0 w-2 h-full ${student.deviceId ? 'bg-emerald-500/50' : 'bg-orange-500/50'}`}></div>
                <div className="w-12 h-12 rounded-full bg-[#2563eb]/20 text-[#5c98ff] flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-white font-bold text-lg truncate">{student.name}</h3>
                <p className="text-gray-400 text-xs truncate mb-4">{student.email}</p>
                <div className="mt-auto flex items-center gap-2 text-xs font-medium">
                  {student.deviceId ? (
                    <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Device Locked</span>
                  ) : (
                    <span className="bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-md border border-orange-500/20 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Unlocked</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-md shadow-2xl p-8 relative">
            <button onClick={() => setShowRegModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-[#0b0f19] p-2 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            <h3 className="text-2xl font-bold text-white mb-6">Register New Student</h3>
            <form onSubmit={handleRegisterStudent} className="flex flex-col gap-4">
              <input type="text" placeholder="Full Name" required value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="bg-[#0b0f19] border border-[#1e293b] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500" />
              <input type="email" placeholder="Email Address" required value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="bg-[#0b0f19] border border-[#1e293b] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500" />
              <input type="password" placeholder="Password" required value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} className="bg-[#0b0f19] border border-[#1e293b] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500" />
              <button type="submit" className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all">Create Account</button>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT DETAILS & CALENDAR MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
            
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-[#0b0f19] p-2 rounded-full transition-colors z-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>

            {/* Modal Header */}
            <div className="p-8 border-b border-[#1e293b] bg-gradient-to-b from-[#101524] to-[#151b2b] relative">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="absolute top-6 right-16 text-xs font-bold bg-[#2563eb]/20 text-[#5c98ff] px-3 py-1.5 rounded-lg hover:bg-[#2563eb]/40 transition-colors"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Info'}
              </button>
              
              <div className="flex items-center gap-5 mt-4">
                <div className="w-16 h-16 rounded-full bg-[#2563eb]/20 text-[#5c98ff] flex items-center justify-center font-bold text-3xl shadow-inner shrink-0">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="flex flex-col gap-2 w-full">
                    <input type="text" required value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} className="bg-[#0b0f19] border border-[#1e293b] text-white rounded-lg px-3 py-1.5 text-sm" />
                    <input type="email" required value={editForm.email} onChange={e=>setEditForm({...editForm, email: e.target.value})} className="bg-[#0b0f19] border border-[#1e293b] text-white rounded-lg px-3 py-1.5 text-sm" />
                    <input type="password" placeholder="New password (optional)" value={editForm.password} onChange={e=>setEditForm({...editForm, password: e.target.value})} className="bg-[#0b0f19] border border-[#1e293b] text-white rounded-lg px-3 py-1.5 text-sm" />
                    <button type="submit" className="bg-[#2563eb] text-white text-xs font-bold py-1.5 rounded-lg">Save Changes</button>
                  </form>
                ) : (
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedStudent.name}</h3>
                    <p className="text-gray-400 text-sm">{selectedStudent.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Calendar Body */}
            <div className="p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                
                {/* Calendar Navigation */}
                <div className="flex items-center gap-4 bg-[#101524] px-4 py-2 rounded-xl border border-[#1e293b]">
                  <button onClick={() => shiftMonth(-1)} className="text-gray-400 hover:text-white p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                  <span className="text-white font-bold min-w-[120px] text-center">{monthNames[calMonth]} {calYear}</span>
                  <button onClick={() => shiftMonth(1)} className="text-gray-400 hover:text-white p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
                </div>
                
                <div className="hidden sm:flex gap-3 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present</span>
                </div>
              </div>

              {isModalLoading ? (
                <div className="h-48 flex items-center justify-center text-gray-500">Loading calendar...</div>
              ) : (
                <div className="bg-[#101524] border border-[#1e293b] p-5 rounded-2xl">
                  <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-gray-500 uppercase">
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {renderCalendar()}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-[#1e293b] bg-[#101524] flex gap-4 shrink-0 mt-auto">
              <button 
                onClick={() => handleResetDevice(selectedStudent._id)}
                disabled={!selectedStudent.deviceId}
                className="flex-1 py-3 rounded-xl font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-[#2563eb]/10 text-[#5c98ff] border border-[#2563eb]/30 hover:bg-[#2563eb]/20"
              >
                {selectedStudent.deviceId ? 'Unlock Device' : 'Device Unlocked'}
              </button>
              
              <button 
                onClick={() => handleRemoveStudent(selectedStudent._id)}
                className="flex-1 py-3 rounded-xl font-bold transition-all text-sm bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 hover:text-red-400"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}