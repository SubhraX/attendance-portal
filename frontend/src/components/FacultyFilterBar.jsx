import { useState, useEffect, useRef } from 'react';
import { STREAMS, STREAM_SECTIONS } from './FacultyRecords';

export default function FacultyFilterBar({
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  setShowRegModal,
  isDarkMode
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredStream, setHoveredStream] = useState(null);
  const [hoverTop, setHoverTop] = useState(0); 

  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);

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

  const handleMouseEnter = (e, stream) => {
    setHoveredStream(stream);
    if (scrollContainerRef.current) {
      const offset = e.currentTarget.offsetTop - scrollContainerRef.current.scrollTop;
      setHoverTop(offset);
    }
  };

  const glassPanel = isDarkMode ? "bg-[#161b26]/60 border-white/10" : "bg-white/60 border-orange-200/50";
  const glassInput = isDarkMode ? "bg-black/40 border-white/10 text-white" : "bg-white/60 border-orange-200/50 text-orange-950";
  const customScrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDarkMode ? '[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-600' : '[&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400'}`;

  const displayLabel = selectedFilter.stream === 'All Streams' 
    ? 'All Streams' 
    : selectedFilter.section === 'All' 
      ? selectedFilter.stream 
      : `${selectedFilter.stream}-${selectedFilter.section}`;

  return (
    <div className={`relative z-50 flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 p-5 md:p-6 rounded-2xl border shadow-xl backdrop-blur-xl ${glassPanel}`}>
      <div>
        <h2 className={`text-xl md:text-2xl font-extrabold tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Student Records</h2>
        <p className={`text-xs mt-0.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>Information for all enrolled students.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 items-center">
        
        {/* Custom Stream/Section Dropdown */}
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

          <div 
            className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 origin-top ${
              isDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            } ${isDarkMode ? 'bg-[#1a2130]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-orange-200 shadow-[0_10px_40px_rgba(234,88,12,0.15)]'}`}
          >
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

            {/* Sub-dropdown for sections */}
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