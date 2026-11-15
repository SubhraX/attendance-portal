import { useState, useEffect, useRef } from 'react';
import RegisterStudentModal from './RegisterStudentModal';
import StudentDetailsModal from './StudentDetailsModal';
import { useTheme } from './ThemeContext';

export const STREAMS = [
  "CSE",
  "AIML",
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

  // Handle clicking outside the custom dropdown to close it
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
      <div className={`flex flex-col xl:flex-row justify-between items-end xl:items-center mb-10 gap-6 p-8 rounded-3xl border shadow-2xl backdrop-blur-xl ${glassPanel}`}>
        <div>
          <h2 className={`text-3xl font-extrabold tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student Directory</h2>
          <p className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Detailed information about all enrolled students.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
          
          {/* CUSTOM ANIMATED DROPDOWN */}
          <div className="relative w-full sm:w-48" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full rounded-full pl-5 pr-4 py-3 focus:outline-none transition-all duration-300 border flex items-center justify-between font-bold text-sm ${glassInput} ${isDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/20' : 'hover:border-orange-400/50'}`}
            >
              <span className="truncate">{selectedStream}</span>
              <svg 
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-orange-500' : isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {/* Dropdown Menu Panel */}
            <div 
              className={`absolute z-50 w-full mt-2 rounded-2xl border shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 origin-top ${
                isDropdownOpen 
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              } ${isDarkMode ? 'bg-[#1a2130]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-orange-200 shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}
            >
              <div className="max-h-60 overflow-y-auto py-2 flex flex-col">
                <div
                  onClick={() => { setSelectedStream('All Streams'); setIsDropdownOpen(false); }}
                  className={`px-5 py-3 cursor-pointer font-bold text-sm transition-colors mx-2 rounded-xl ${
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
                    className={`px-5 py-3 cursor-pointer font-bold text-sm transition-colors mx-2 rounded-xl ${
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

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search Student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-full pl-5 pr-10 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all border text-sm font-medium ${glassInput}`}
            />
            <svg className={`w-5 h-5 absolute right-4 top-3.5 ${isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          
          <button
            onClick={() => setShowRegModal(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.4)] whitespace-nowrap active:scale-95 text-sm"
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
                className={`border rounded-3xl p-6 cursor-pointer transition-all group relative overflow-hidden flex flex-col shadow-xl backdrop-blur-md ${isDarkMode ? 'bg-[#11161d]/80 border-white/10 hover:border-orange-500/50 hover:bg-[#1a2130]/90' : 'bg-white/80 border-orange-200/50 hover:border-orange-400 hover:bg-white/95'}`}
              >
                <div className={`absolute top-0 right-0 w-3 h-full transition-colors ${student.deviceId ? 'bg-emerald-500/80 group-hover:bg-emerald-500' : 'bg-orange-500/80 group-hover:bg-orange-500'}`}></div>
                
                <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-orange-900/70'}`}>Student {idx + 1}</p>
                <h3 className={`font-extrabold text-xl truncate mb-1 transition-colors ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-orange-950 group-hover:text-orange-600'}`}>{student.name.toUpperCase()}</h3>
                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>{student.email}</p>
                
                <p className={`inline-flex w-max px-2.5 py-1 rounded-md text-[10px] uppercase font-extrabold truncate mb-6 mt-2 tracking-wider ${isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                  {student.stream || 'No Stream'}
                </p>
                
                <div className="mt-auto flex flex-col gap-3">
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>
                    Device: <span className={student.deviceId ? 'text-emerald-400' : 'text-orange-500'}>{student.deviceId ? 'Locked' : 'Active'}</span>
                  </p>
                  
                  {student.deviceId ? (
                    <span className="bg-transparent border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors group-hover:bg-emerald-500/10"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Unlock Device</span>
                  ) : (
                    <span className="bg-transparent border border-orange-500/50 text-orange-500 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors group-hover:bg-orange-500/10"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Active Device</span>
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