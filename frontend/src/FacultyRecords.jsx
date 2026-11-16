import { useState, useEffect, useRef } from 'react';
import RegisterStudentModal from './RegisterStudentModal';
import StudentDetailsModal from './StudentDetailsModal';
import { useTheme } from './ThemeContext';

export const STREAM_SECTIONS = {
  "CSE": ["G", "H", "I", "J"],
  "CSE(AIML)": ["K"],
  "ECE": ["A", "B", "C", "D"],
  "EEE": ["E", "F"],
  "ME": ["R", "S"],
  "CE": ["M"],
  "PIE": ["L"],
  "Chemical": ["N", "O"],
  "BT": ["P"],
  "FET": ["Q"]
};
export const STREAMS = Object.keys(STREAM_SECTIONS);

export default function FacultyRecords() {
  const { isDarkMode } = useTheme();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Updated filtering state to track Stream and Section independently
  const [selectedFilter, setSelectedFilter] = useState({ stream: 'All Streams', section: 'All' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredStream, setHoveredStream] = useState(null);
  const [hoverTop, setHoverTop] = useState(0); // Tracks dynamic Y-offset for side menu
  
  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setHoveredStream(null);
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
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStream = false;
    if (selectedFilter.stream === 'All Streams') {
      matchesStream = true;
    } else {
      const isSameStream = s.stream === selectedFilter.stream;
      const isSameSection = selectedFilter.section === 'All' || s.section === selectedFilter.section;
      matchesStream = isSameStream && isSameSection;
    }
    
    return matchesSearch && matchesStream;
  });

  const handleMouseEnter = (e, stream) => {
    setHoveredStream(stream);
    // Calculate precise vertical offset relative to the scrollable container
    if (scrollContainerRef.current) {
      const offset = e.currentTarget.offsetTop - scrollContainerRef.current.scrollTop;
      setHoverTop(offset);
    }
  };

  const glassPanel = isDarkMode ? "bg-[#161b26]/60 border-white/10" : "bg-white/60 border-orange-200/50";
  const glassInput = isDarkMode ? "bg-black/40 border-white/10 text-white" : "bg-white/60 border-orange-200/50 text-orange-950";
  const customScrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDarkMode ? '[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-600' : '[&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400'}`;

  // Helper for dynamic button label
  const displayLabel = selectedFilter.stream === 'All Streams' 
    ? 'All Streams' 
    : selectedFilter.section === 'All' 
      ? selectedFilter.stream 
      : `${selectedFilter.stream}-${selectedFilter.section}`;

  return (
    <div className="w-full flex flex-col h-full relative z-10">
      <div className={`relative z-50 flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 p-5 md:p-6 rounded-2xl border shadow-xl backdrop-blur-xl ${glassPanel}`}>
        <div>
          <h2 className={`text-xl md:text-2xl font-extrabold tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student Records</h2>
          <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Information for all enrolled students.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 items-center">
          
          <div className="relative w-full sm:w-44" ref={dropdownRef} onMouseLeave={() => setHoveredStream(null)}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full rounded-xl pl-4 pr-3 py-2.5 focus:outline-none transition-all duration-300 border flex items-center justify-between font-bold text-xs md:text-sm ${glassInput} ${isDropdownOpen ? 'border-orange-500 ring-1 ring-orange-500/20' : 'hover:border-orange-400/50'}`}
            >
              <span className="truncate">{displayLabel}</span>
              <svg 
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-orange-500' : isDarkMode ? 'text-gray-400' : 'text-orange-400'}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            {/* Dropdown Container */}
            <div 
              className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 origin-top ${
                isDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
              } ${isDarkMode ? 'bg-[#1a2130]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-orange-200 shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}
            >
              {/* Scrollable Parent */}
              <div ref={scrollContainerRef} className={`max-h-56 overflow-y-auto py-1.5 flex flex-col relative ${customScrollbar}`}>
                <div
                  onClick={() => { setSelectedFilter({ stream: 'All Streams', section: 'All' }); setIsDropdownOpen(false); setHoveredStream(null); }}
                  onMouseEnter={() => setHoveredStream(null)}
                  className={`px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                    selectedFilter.stream === 'All Streams' ? 'bg-orange-500/20 text-orange-500' : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                  }`}
                >
                  All Streams
                </div>
                
                {STREAMS.map(stream => (
                  <div
                    key={stream}
                    onMouseEnter={(e) => handleMouseEnter(e, stream)}
                    onClick={() => { setSelectedFilter({ stream, section: 'All' }); setIsDropdownOpen(false); setHoveredStream(null); }}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                      selectedFilter.stream === stream 
                        ? 'bg-orange-500/20 text-orange-500' 
                        : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                    }`}
                  >
                    <span className="truncate">{stream}</span>
                    {STREAM_SECTIONS[stream]?.length > 0 && (
                      <svg className="w-3.5 h-3.5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    )}
                  </div>
                ))}
              </div>

              {/* Absolutely Positioned Side Menu */}
              {isDropdownOpen && hoveredStream && STREAM_SECTIONS[hoveredStream]?.length > 0 && (
                <div 
                  className={`absolute z-50 left-[102%] w-36 rounded-xl border shadow-2xl backdrop-blur-2xl py-1.5 overflow-hidden animate-fade-in-up ${
                    isDarkMode ? 'bg-[#1a2130]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-orange-200 shadow-[0_10px_40px_rgba(234,88,12,0.15)]'
                  }`}
                  style={{ top: Math.max(0, hoverTop - 5) }} 
                >
                  <div className={`max-h-56 overflow-y-auto flex flex-col ${customScrollbar}`}>
                    <div 
                      onClick={() => { setSelectedFilter({ stream: hoveredStream, section: 'All' }); setIsDropdownOpen(false); setHoveredStream(null); }}
                      className={`px-4 py-2 cursor-pointer font-bold text-[11px] uppercase tracking-wider mx-1.5 rounded-lg mb-1 transition-colors ${
                        isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-orange-900/60 hover:text-orange-950 hover:bg-orange-50'
                      }`}
                    >
                      All {hoveredStream}
                    </div>
                    {STREAM_SECTIONS[hoveredStream].map(section => (
                      <div
                        key={section}
                        onClick={() => { setSelectedFilter({ stream: hoveredStream, section }); setIsDropdownOpen(false); setHoveredStream(null); }}
                        className={`px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                          selectedFilter.stream === hoveredStream && selectedFilter.section === section
                            ? 'bg-orange-500/20 text-orange-500' 
                            : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                        }`}
                      >
                        Section {section}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <div className={`absolute top-0 right-0 w-2 h-full transition-colors ${student.deviceId ? 'bg-emerald-500/80 group-hover:bg-emerald-500' : 'bg-orange-500/80 group-hover:bg-orange-500'}`}></div>
                
                <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>Student {idx + 1}</p>
                <h3 className={`font-extrabold text-base truncate mb-0.5 transition-colors ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-orange-950 group-hover:text-orange-600'}`}>{student.name.toUpperCase()}</h3>
                <p className={`text-[11px] truncate font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/60'}`}>{student.email}</p>
                
                <p className={`inline-flex w-max px-2 py-0.5 rounded-md text-[9px] uppercase font-bold truncate mb-4 mt-2 tracking-wide ${isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                  {student.stream || 'Unassigned'} {student.section && student.section !== 'Unassigned' ? `- ${student.section}` : ''}
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