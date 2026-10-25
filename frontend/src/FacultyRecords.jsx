import { useState, useEffect } from 'react';

export default function FacultyRecords() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceDates, setAttendanceDates] = useState(new Set());
  const [isModalLoading, setIsModalLoading] = useState(false);

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

  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setIsModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${student._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const records = await res.json();
      
      if (res.ok) {
        // Extract just the dates (YYYY-MM-DD) into a Set for fast calendar lookup
        const dates = new Set(records.map(r => new Date(r.createdAt).toISOString().split('T')[0]));
        setAttendanceDates(dates);
      }
    } catch (error) {
      console.error("Failed to fetch student attendance", error);
    }
    setIsModalLoading(false);
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
        setSelectedStudent(null);
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

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Calendar Generator Logic ---
  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    // Empty slots before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      // Format current day to YYYY-MM-DD to check against our Set
      const dateString = new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];
      const isPresent = attendanceDates.has(dateString);
      
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

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 bg-[#151b2b] p-6 rounded-2xl border border-[#1e293b] shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Student Directory</h2>
          <p className="text-gray-400 text-sm mt-1">Manage enrollments and view visual attendance</p>
        </div>
        <div className="relative w-full md:w-72">
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
                className="bg-[#151b2b] border border-[#1e293b] rounded-2xl p-5 hover:border-[#5c98ff] hover:shadow-[0_0_20px_rgba(92,152,255,0.1)] cursor-pointer transition-all group relative overflow-hidden"
              >
                {/* Visual Indicator for Device Lock */}
                <div className={`absolute top-0 right-0 w-2 h-full ${student.deviceId ? 'bg-emerald-500/50' : 'bg-orange-500/50'}`}></div>
                
                <div className="w-12 h-12 rounded-full bg-[#2563eb]/20 text-[#5c98ff] flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-white font-bold text-lg truncate">{student.name}</h3>
                <p className="text-gray-400 text-xs truncate mb-4">{student.email}</p>
                
                <div className="flex items-center gap-2 text-xs font-medium">
                  {student.deviceId ? (
                    <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Device Locked
                    </span>
                  ) : (
                    <span className="bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-md border border-orange-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Unlocked
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modern Modal overlay for Student Details */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-[#151b2b] border border-[#1e293b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative">
            
            {/* Close Button */}
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-[#0b0f19] p-2 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {/* Modal Header */}
            <div className="p-8 border-b border-[#1e293b] bg-gradient-to-b from-[#101524] to-[#151b2b]">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#2563eb]/20 text-[#5c98ff] flex items-center justify-center font-bold text-3xl shadow-inner">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedStudent.name}</h3>
                  <p className="text-gray-400 text-sm">{selectedStudent.email}</p>
                </div>
              </div>
            </div>

            {/* Visual Calendar Body */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#5c98ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Current Month Attendance
                </h4>
                <div className="flex gap-3 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600"></span> Absent/No Class</span>
                </div>
              </div>

              {isModalLoading ? (
                <div className="h-48 flex items-center justify-center text-gray-500">Loading calendar...</div>
              ) : (
                <div className="bg-[#101524] border border-[#1e293b] p-5 rounded-2xl">
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-gray-500 uppercase">
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                  </div>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {renderCalendar()}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-[#1e293b] bg-[#101524] flex gap-4">
              <button 
                onClick={() => handleResetDevice(selectedStudent._id)}
                disabled={!selectedStudent.deviceId}
                className="flex-1 py-3 rounded-xl font-bold transition-all text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-[#2563eb]/10 text-[#5c98ff] border border-[#2563eb]/30 hover:bg-[#2563eb]/20"
              >
                {selectedStudent.deviceId ? 'Unlock Device ID' : 'Device Already Unlocked'}
              </button>
              
              <button 
                onClick={() => handleRemoveStudent(selectedStudent._id)}
                className="flex-1 py-3 rounded-xl font-bold transition-all text-sm
                bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 hover:text-red-400"
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