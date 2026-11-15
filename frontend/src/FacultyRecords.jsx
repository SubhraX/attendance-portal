import { useState, useEffect } from 'react';
import RegisterStudentModal from './RegisterStudentModal';
import StudentDetailsModal from './StudentDetailsModal';
import { useTheme } from './ThemeContext';

export const STREAMS = [
  "CSE",
  "CSE(AIML)",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "PIE",
  "Chemical",
  "BT",
  "FET"
];

export default function FacultyRecords() {
  const { isDarkMode } = useTheme();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState('All Streams');
  
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

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStream = selectedStream === 'All Streams' || s.stream === selectedStream;
    return matchesSearch && matchesStream;
  });

  const glassPanel = isDarkMode ? "bg-[#161b26]/60 border-white/10" : "bg-white/60 border-orange-200/50";
  const glassInput = isDarkMode ? "bg-black/40 border-white/10 text-white" : "bg-white/60 border-orange-200/50 text-orange-950";
  const optionStyle = isDarkMode ? "bg-[#11161d] text-white" : "bg-white text-orange-950";

  return (
    <div className="w-full flex flex-col h-full relative z-10">
      <div className={`flex flex-col xl:flex-row justify-between items-end xl:items-center mb-10 gap-6 p-8 rounded-3xl border shadow-2xl backdrop-blur-xl ${glassPanel}`}>
        <div>
          <h2 className={`text-3xl font-extrabold tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student Directory</h2>
          <p className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Detailed information about all enrolled students.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
          
          <div className="relative w-full sm:w-44">
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className={`w-full rounded-full pl-5 pr-10 py-3 focus:outline-none focus:border-orange-500 transition-colors border appearance-none cursor-pointer truncate font-bold ${glassInput}`}
            >
              <option value="All Streams" className={optionStyle}>All Streams</option>
              {STREAMS.map(stream => (
                <option key={stream} value={stream} className={optionStyle}>{stream}</option>
              ))}
            </select>
            <svg className={`w-4 h-4 absolute right-4 top-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search Student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-full pl-5 pr-10 py-3 focus:outline-none focus:border-orange-500 transition-colors border ${glassInput}`}
            />
            <svg className={`w-5 h-5 absolute right-4 top-3.5 ${isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          
          <button
            onClick={() => setShowRegModal(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.4)] whitespace-nowrap active:scale-95"
          >
            Register Student
          </button>
        </div>
      </div>

      <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student cards</h3>

      {loading ? (
        <div className={`flex-1 flex items-center justify-center font-bold ${isDarkMode ? 'text-gray-400' : 'text-orange-900/50'}`}>Loading directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up pb-10">
          {filteredStudents.length === 0 ? (
            <div className={`col-span-full text-center py-10 border border-dashed rounded-3xl ${isDarkMode ? 'text-gray-500 border-white/20' : 'text-orange-900/50 font-medium border-orange-200'}`}>No students found matching your criteria.</div>
          ) : (
            filteredStudents.map((student, idx) => (
              <div
                key={student._id}
                onClick={() => setSelectedStudent(student)}
                className={`border rounded-3xl p-6 cursor-pointer transition-all group relative overflow-hidden flex flex-col shadow-xl backdrop-blur-md ${isDarkMode ? 'bg-[#11161d]/80 border-white/10 hover:border-orange-500/50' : 'bg-white/80 border-orange-200/50 hover:border-orange-400'}`}
              >
                <div className={`absolute top-0 right-0 w-3 h-full ${student.deviceId ? 'bg-emerald-500/80' : 'bg-orange-500/80'}`}></div>
                
                <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-orange-900/70'}`}>Student {idx + 1}</p>
                <h3 className={`font-extrabold text-xl truncate mb-1 ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{student.name.toUpperCase()}</h3>
                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>{student.email}</p>
                
                <p className={`inline-flex w-max px-2.5 py-1 rounded-md text-[10px] uppercase font-extrabold truncate mb-6 mt-1 tracking-wider ${isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                  {student.stream || 'No Stream'}
                </p>
                
                <div className="mt-auto flex flex-col gap-3">
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>
                    Device: <span className={student.deviceId ? 'text-emerald-400' : 'text-orange-400'}>{student.deviceId ? 'Locked' : 'Active'}</span>
                  </p>
                  
                  {student.deviceId ? (
                    <span className="bg-transparent border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Unlock Device</span>
                  ) : (
                    <span className="bg-transparent border border-orange-500/50 text-orange-400 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Active Device</span>
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