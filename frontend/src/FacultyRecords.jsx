import { useState, useEffect } from 'react';
import RegisterStudentModal from './RegisterStudentModal';
import StudentDetailsModal from './StudentDetailsModal';

export default function FacultyRecords() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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
                onClick={() => setSelectedStudent(student)}
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

      {/* Render Modals Separately */}
      {showRegModal && (
        <RegisterStudentModal 
          onClose={() => setShowRegModal(false)} 
          onSuccess={fetchStudents} 
        />
      )}

      {selectedStudent && (
        <StudentDetailsModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
          onUpdate={fetchStudents} 
        />
      )}

    </div>
  );
}