import { useState, useEffect, useRef } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  return (
    <div className="w-full flex flex-col h-full relative z-10">
      
      {/* COMPACT HEADER */}
      <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 p-5 md:p-6 rounded-2xl border shadow-xl backdrop-blur-xl ${glassPanel}`}>
        <div>
          <h2 className={`text-xl md:text-2xl font-extrabold tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student Directory</h2>
          <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Information for all enrolled students.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 items-center">
          
          <div className="relative w-full sm:w-44" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full rounded-xl pl-4 pr-3 py-2.5 focus:outline-none transition-all duration-300 border flex items-center justify-between font-bold text-xs md:text-sm ${glassInput} ${isDropdownOpen ? 'border-orange-500 ring-1 ring-orange-500/20' : 'hover:border-orange-400/50'}`}
            >
              <span className="truncate">{selectedStream}</span>
              <svg 
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-orange-500' : isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <div 
              className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 origin-top ${
                isDropdownOpen 
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              } ${isDarkMode ? 'bg-[#1a2130]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-orange-200 shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}
            >
              <div className="max-h-56 overflow-y-auto py-1.5 flex flex-col">
                <div
                  onClick={() => { setSelectedStream('All Streams'); setIsDropdownOpen(false); }}
                  className={`px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                    selectedStream === 'All Streams' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                  }`}
                >
                  All Streams
                </div>
                {STREAMS.map(stream => (
                  <div
                    key={stream}
                    onClick={() => { setSelectedStream(stream); setIsDropdownOpen(false); }}
                    className={`px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                      selectedStream === stream 
                        ? 'bg-orange-500/20 text-orange-500' 
                        : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                    }`}
                  >
                    {stream}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl pl-4 pr-9 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all border text-xs md:text-sm font-medium ${glassInput}`}
            />
            <svg className={`w-4 h-4 absolute right-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          
          <button
            onClick={() => setShowRegModal(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(234,88,12,0.3)] whitespace-nowrap active:scale-95 text-xs md:text-sm"
          >
            Register Student
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`flex-1 flex items-center justify-center font-bold text-sm ${isDarkMode ? 'text-gray-400' : 'text-orange-900/50'}`}>Loading directory...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-10">
          {filteredStudents.length === 0 ? (
            <div className={`col-span-full text-center py-10 border border-dashed rounded-2xl text-sm ${isDarkMode ? 'text-gray-500 border-white/20' : 'text-orange-900/50 font-medium border-orange-200'}`}>No students found.</div>
          ) : (
            filteredStudents.map((student, idx) => (
              <div
                key={student._id}
                onClick={() => setSelectedStudent(student)}
                className={`border rounded-2xl p-4 cursor-pointer transition-all group relative overflow-hidden flex flex-col shadow-lg backdrop-blur-md ${isDarkMode ? 'bg-[#11161d]/80 border-white/10 hover:border-orange-500/50 hover:bg-[#1a2130]/90' : 'bg-white/80 border-orange-200/50 hover:border-orange-400 hover:bg-white/95'}`}
              >
                {/* COMPACT STUDENT CARDS */}
                <div className={`absolute top-0 right-0 w-2 h-full transition-colors ${student.deviceId ? 'bg-emerald-500/80 group-hover:bg-emerald-500' : 'bg-orange-500/80 group-hover:bg-orange-500'}`}></div>
                
                <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Student {idx + 1}</p>
                <h3 className={`font-extrabold text-base truncate mb-0.5 transition-colors ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-orange-950 group-hover:text-orange-600'}`}>{student.name.toUpperCase()}</h3>
                <p className={`text-[11px] truncate font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>{student.email}</p>
                
                <p className={`inline-flex w-max px-2 py-0.5 rounded-md text-[9px] uppercase font-bold truncate mb-4 mt-2 tracking-wide ${isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                  {student.stream || 'No Stream'}
                </p>
                
                <div className="mt-auto">
                  {student.deviceId ? (
                    <span className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-bold transition-colors group-hover:bg-emerald-500/20">
                      Locked to Device <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </span>
                  ) : (
                    <span className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-bold transition-colors group-hover:bg-orange-500/20">
                      Active Access <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    </span>
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