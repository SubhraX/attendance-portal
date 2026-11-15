import { useState, useEffect } from 'react';
import RegisterStudentModal from './RegisterStudentModal';
import StudentDetailsModal from './StudentDetailsModal';
import { useTheme } from './ThemeContext';

export default function FacultyRecords() {
  const { isDarkMode } = useTheme();
  
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
    } catch (error) {}
    setLoading(false);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-full relative">

      {/* Header & Controls */}
      <div className={`flex flex-col lg:flex-row justify-between items-end lg:items-center mb-8 gap-4 p-6 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b]' : 'bg-white border-orange-200'}`}>
        <div>
          <h2 className={`text-2xl font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student Directory</h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60 font-medium'}`}>Manage enrollments and view visual attendance</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <button
            onClick={() => setShowRegModal(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.2)] flex items-center justify-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            Register Student
          </button>
          <div className="relative w-full sm:w-72">
            <svg className={`w-5 h-5 absolute left-3 top-3 ${isDarkMode ? 'text-gray-500' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500 transition-colors ${isDarkMode ? 'bg-[#0b0f19] border-[#1e293b] text-white border' : 'bg-[#fffaf0] border border-orange-200 text-orange-950 font-medium placeholder-orange-900/40 focus:ring-2 focus:ring-orange-500/20'}`}
            />
          </div>
        </div>
      </div>

      {/* Grid of Student Cards */}
      {loading ? (
        <div className={`flex-1 flex items-center justify-center font-bold ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50'}`}>Loading student directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up pb-10">
          {filteredStudents.length === 0 ? (
            <div className={`col-span-full text-center py-10 border border-dashed rounded-2xl ${isDarkMode ? 'text-gray-500 border-gray-700' : 'text-orange-900/50 font-medium border-orange-200'}`}>No students found.</div>
          ) : (
            filteredStudents.map(student => (
              <div
                key={student._id}
                onClick={() => setSelectedStudent(student)}
                className={`border rounded-2xl p-5 cursor-pointer transition-all group relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#151b2b] border-[#1e293b] hover:border-orange-500 hover:shadow-[0_0_20px_rgba(234,88,12,0.1)]' : 'bg-white border-orange-200 hover:border-orange-400 hover:shadow-lg'}`}
              >
                <div className={`absolute top-0 right-0 w-2 h-full ${student.deviceId ? isDarkMode ? 'bg-emerald-500/50' : 'bg-emerald-500/80' : isDarkMode ? 'bg-orange-500/50' : 'bg-orange-400/80'}`}></div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-orange-500/20 text-orange-500' : 'bg-orange-100 text-orange-700'}`}>
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <h3 className={`font-bold text-lg truncate ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{student.name}</h3>
                <p className={`text-xs truncate mb-4 ${isDarkMode ? 'text-gray-400' : 'text-orange-700/80 font-medium'}`}>{student.email}</p>
                <div className="mt-auto flex items-center gap-2 text-xs font-medium">
                  {student.deviceId ? (
                    <span className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Device Locked</span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${isDarkMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-700 border-orange-200'}`}><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Unlocked</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showRegModal && (
        <RegisterStudentModal onClose={() => setShowRegModal(false)} onSuccess={fetchStudents} />
      )}
      {selectedStudent && (
        <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={fetchStudents} />
      )}
    </div>
  );
}