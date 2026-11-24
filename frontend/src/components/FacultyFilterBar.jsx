import { useState, useEffect, useRef } from 'react';
import { STREAMS, STREAM_SECTIONS } from '../FacultyRecords';

export default function FacultyFilterBar({
  students = [],
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  setShowRegModal,
  isDarkMode
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredStream, setHoveredStream] = useState(null);
  const [hoveredYear, setHoveredYear] = useState(null);
  const [hoverTop, setHoverTop] = useState(0);
  const [hoverYearTop, setHoverYearTop] = useState(0);

  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setHoveredStream(null);
        setHoveredYear(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStreamMouseEnter = (e, stream) => {
    setHoveredStream(stream);
    setHoveredYear(null);
    if (scrollContainerRef.current) {
      const offset = e.currentTarget.offsetTop - scrollContainerRef.current.scrollTop;
      setHoverTop(offset);
    }
  };

  const handleYearMouseEnter = (e, year) => {
    setHoveredYear(year);
    setHoverYearTop(e.currentTarget.offsetTop);
  };

  // Dynamically derive unique sorted admission years for a stream (newest first)
  const getYearsForStream = (stream) => {
    const years = students
      .filter(s => s.stream === stream && s.admissionYear)
      .map(s => Number(s.admissionYear));
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const selectAndClose = (filter) => {
    setSelectedFilter(filter);
    setIsDropdownOpen(false);
    setHoveredStream(null);
    setHoveredYear(null);
  };

  const glassPanel = isDarkMode ? "bg-[#161b26]/60 border-white/10" : "bg-white/60 border-orange-200/50";
  const glassInput = isDarkMode ? "bg-black/40 border-white/10 text-white" : "bg-white/60 border-orange-200/50 text-orange-950";
  const menuBg = isDarkMode
    ? "bg-[#1a2130]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
    : "bg-white/95 border-orange-200 shadow-[0_10px_40px_rgba(234,88,12,0.15)]";
  const customScrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDarkMode ? '[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-600' : '[&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400'}`;

  const displayLabel = (() => {
    if (selectedFilter.stream === 'All Streams') return 'All Streams';
    const parts = [selectedFilter.stream];
    if (selectedFilter.year && selectedFilter.year !== 'All') parts.push(selectedFilter.year);
    if (selectedFilter.section && selectedFilter.section !== 'All') parts.push(`Sec ${selectedFilter.section}`);
    return parts.join(' · ');
  })();

  const activeStreamYears = hoveredStream ? getYearsForStream(hoveredStream) : [];

  return (
    <div className={`relative z-50 flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 p-5 md:p-6 rounded-2xl border shadow-xl backdrop-blur-xl ${glassPanel}`}>
      <div>
        <h2 className={`text-xl md:text-2xl font-extrabold tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student Records</h2>
        <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Information for all enrolled students.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 items-center">
        
        {/* Custom Stream -> Year -> Section Dropdown */}
        <div
          className="relative w-full sm:w-52"
          ref={dropdownRef}
          onMouseLeave={() => { setHoveredStream(null); setHoveredYear(null); }}
        >
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

          <div 
            className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 origin-top ${
              isDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            } ${menuBg}`}
          >
            {/* Level 1: Streams */}
            <div ref={scrollContainerRef} className={`max-h-56 overflow-y-auto py-1.5 flex flex-col relative ${customScrollbar}`}>
              <div
                onClick={() => selectAndClose({ stream: 'All Streams', year: 'All', section: 'All' })}
                onMouseEnter={() => { setHoveredStream(null); setHoveredYear(null); }}
                className={`px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                  selectedFilter.stream === 'All Streams' ? 'bg-orange-500/20 text-orange-500' : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                }`}
              >
                All Streams
              </div>
              
              {STREAMS.map(stream => (
                <div
                  key={stream}
                  onMouseEnter={(e) => handleStreamMouseEnter(e, stream)}
                  onClick={() => selectAndClose({ stream, year: 'All', section: 'All' })}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                    selectedFilter.stream === stream 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                  }`}
                >
                  <span className="truncate">{stream}</span>
                  {(getYearsForStream(stream).length > 0 || STREAM_SECTIONS[stream]?.length > 0) && (
                    <svg className="w-3.5 h-3.5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                  )}
                </div>
              ))}
            </div>

            {/* Level 2: Dynamic Years (falls back to Sections if no years exist yet) */}
            {isDropdownOpen && hoveredStream && (activeStreamYears.length > 0 || STREAM_SECTIONS[hoveredStream]?.length > 0) && (
              <div 
                className={`absolute z-50 left-[102%] w-36 rounded-xl border shadow-2xl backdrop-blur-2xl py-1.5 animate-fade-in-up ${menuBg}`}
                style={{ top: Math.max(0, hoverTop - 5) }} 
              >
                <div className={`max-h-56 overflow-y-auto flex flex-col ${customScrollbar}`}>
                  <div 
                    onClick={() => selectAndClose({ stream: hoveredStream, year: 'All', section: 'All' })}
                    onMouseEnter={() => setHoveredYear(null)}
                    className={`px-4 py-2 cursor-pointer font-bold text-[11px] uppercase tracking-wider mx-1.5 rounded-lg mb-1 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-orange-900/60 hover:text-orange-950 hover:bg-orange-50'
                    }`}
                  >
                    All {hoveredStream}
                  </div>

                  {activeStreamYears.length > 0 ? (
                    activeStreamYears.map(year => (
                      <div
                        key={year}
                        onMouseEnter={(e) => handleYearMouseEnter(e, year)}
                        onClick={() => selectAndClose({ stream: hoveredStream, year, section: 'All' })}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                          selectedFilter.stream === hoveredStream && Number(selectedFilter.year) === year
                            ? 'bg-orange-500/20 text-orange-500' 
                            : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                        }`}
                      >
                        <span>{year}</span>
                        {STREAM_SECTIONS[hoveredStream]?.length > 0 && (
                          <svg className="w-3.5 h-3.5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                        )}
                      </div>
                    ))
                  ) : (
                    STREAM_SECTIONS[hoveredStream].map(section => (
                      <div
                        key={section}
                        onClick={() => selectAndClose({ stream: hoveredStream, year: 'All', section })}
                        className={`px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                          selectedFilter.stream === hoveredStream && selectedFilter.section === section
                            ? 'bg-orange-500/20 text-orange-500' 
                            : isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-orange-950 hover:bg-orange-50'
                        }`}
                      >
                        Section {section}
                      </div>
                    ))
                  )}
                </div>

                {/* Level 3: Sections for Hovered Year */}
                {hoveredYear && STREAM_SECTIONS[hoveredStream]?.length > 0 && (
                  <div
                    className={`absolute z-50 left-[102%] w-36 rounded-xl border shadow-2xl backdrop-blur-2xl py-1.5 animate-fade-in-up ${menuBg}`}
                    style={{ top: Math.max(0, hoverYearTop - 5) }}
                  >
                    <div className={`max-h-56 overflow-y-auto flex flex-col ${customScrollbar}`}>
                      <div
                        onClick={() => selectAndClose({ stream: hoveredStream, year: hoveredYear, section: 'All' })}
                        className={`px-4 py-2 cursor-pointer font-bold text-[11px] uppercase tracking-wider mx-1.5 rounded-lg mb-1 transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-orange-900/60 hover:text-orange-950 hover:bg-orange-50'
                        }`}
                      >
                        All {hoveredYear}
                      </div>
                      {STREAM_SECTIONS[hoveredStream].map(section => (
                        <div
                          key={section}
                          onClick={() => selectAndClose({ stream: hoveredStream, year: hoveredYear, section })}
                          className={`px-4 py-2.5 cursor-pointer font-bold text-xs transition-colors mx-1.5 rounded-lg ${
                            selectedFilter.stream === hoveredStream && Number(selectedFilter.year) === hoveredYear && selectedFilter.section === section
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
            )}
          </div>
        </div>

        {/* Search Bar */}
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
        
        {/* Register Button */}
        <button
          onClick={() => setShowRegModal(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(234,88,12,0.3)] whitespace-nowrap active:scale-95 text-xs md:text-sm"
        >
          Register Student
        </button>
      </div>
    </div>
  );
}