export default function InstructorSidebar({
  activeTab,
  setActiveTab,
  isSidebarExpanded,
  setIsSidebarExpanded,
  isDarkMode,
  toggleTheme,
  handleLogout
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`md:border-r border-b flex flex-row md:flex-col p-4 md:p-6 z-20 relative shrink-0 w-full md:w-auto ${isSidebarExpanded ? 'md:w-64' : 'md:w-24 md:items-center'} justify-between md:justify-start ${isDarkMode ? 'bg-[#10141d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div
          onClick={() => { if (window.innerWidth >= 768) setIsSidebarExpanded(!isSidebarExpanded) }}
          className={`flex items-center md:mb-10 md:pb-6 md:border-b cursor-pointer shrink-0 ${isSidebarExpanded ? 'gap-3' : 'gap-3 md:justify-center w-full'} ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}
          title="Toggle Sidebar"
        >
          <img src="/BITS_logo.png" alt="BIT Mesra" className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white/10 rounded-full p-1 shrink-0" />
          <div className={`flex-col ${!isSidebarExpanded ? 'flex md:hidden' : 'flex'}`}>
            <h2 className={`text-lg font-bold tracking-wide uppercase leading-tight whitespace-nowrap ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>BIT Mesra</h2>
            <span className={`text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${isDarkMode ? 'text-orange-500' : 'text-orange-700'}`}>Faculty Portal</span>
          </div>
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleTheme} className={`p-2.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
            {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
          <button onClick={handleLogout} className={`p-2.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-red-500' : 'bg-white border-gray-300 text-red-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>

        {/* Desktop Main Navigation */}
        <div className={`hidden md:flex flex-col gap-2 w-full ${!isSidebarExpanded && 'items-center'}`}>
          <button onClick={() => setActiveTab('generate')} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'generate' ? 'bg-orange-600 border-orange-600 text-white' : isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">Generate QR</span>}
          </button>

          <button onClick={() => setActiveTab('records')} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'records' ? 'bg-orange-600 border-orange-600 text-white' : isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">Records</span>}
          </button>
        </div>

        {/* Desktop Footer Nav */}
        <div className={`hidden md:flex mt-auto pt-6 border-t flex-col gap-2 w-full ${!isSidebarExpanded && 'items-center'} ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
          <button onClick={toggleTheme} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            {isDarkMode ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            {isSidebarExpanded && <span className="whitespace-nowrap">Theme</span>}
          </button>

          <button onClick={handleLogout} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${isDarkMode ? 'bg-transparent border-transparent text-red-500 hover:bg-gray-800' : 'bg-transparent border-transparent text-red-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">Log Out</span>}
          </button>

          {isSidebarExpanded && (
            <div className={`mt-4 text-[10px] text-center font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              &copy; {new Date().getFullYear()} BIT Mesra
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Floating Nav */}
      <div className={`md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center p-1 rounded-xl border z-50 ${isDarkMode ? 'bg-[#10141d] border-gray-800' : 'bg-white border-gray-300'}`}>
        <button onClick={() => setActiveTab('generate')} className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'generate' ? 'bg-orange-600 text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          <span className={activeTab === 'generate' ? 'block' : 'hidden sm:block'}>QR Code</span>
        </button>
        <button onClick={() => setActiveTab('records')} className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'records' ? 'bg-orange-600 text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span className={activeTab === 'records' ? 'block' : 'hidden sm:block'}>Records</span>
        </button>
      </div>
    </>
  );
}