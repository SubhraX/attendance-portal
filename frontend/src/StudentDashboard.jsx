import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';

export default function StudentDashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('scan');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const [studentInfo, setStudentInfo] = useState({ name: 'Student', email: '' });
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setStudentInfo(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchMyStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchMyStats = async () => {
    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/attendance/my-records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const records = await res.json();

      if (res.ok && Array.isArray(records)) {
        const dataMap = {};
        records.forEach(r => {
          const d = new Date(r.createdAt || r.date);
          if (!isNaN(d)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dataMap[dateStr] = r.status || 'present';
          }
        });
        setAttendanceData(dataMap);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const shiftMonth = (offset) => {
    let newMonth = calMonth + offset;
    let newYear = calYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    else if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setCalMonth(newMonth); setCalYear(newYear);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];

      let styleClass = isDarkMode ? 'text-gray-500' : 'text-orange-900/40';
      if (status === 'present') {
        styleClass = 'bg-emerald-600 text-white rounded-md';
      } else if (status === 'absent') {
        styleClass = 'bg-red-600 text-white rounded-md';
      }

      days.push(
        <div key={day} className={`h-10 flex items-center justify-center text-sm font-bold cursor-default ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;

  const bgImage = isDarkMode ? "url('/BITS_Night.png')" : "url('/BITS.png')";
  const overlayClass = isDarkMode ? "bg-[#0b101a]/90 backdrop-blur-sm" : "bg-[#fffaf0]/90 backdrop-blur-sm";
  const panelClass = isDarkMode ? "bg-[#161b26] border-gray-800" : "bg-white border-gray-200";

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-orange-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed relative text-gray-200"
      style={{ backgroundImage: bgImage }}
    >
      <div className={`absolute inset-0 z-0 ${overlayClass}`}></div>

      <div className={`md:border-r border-b flex flex-row md:flex-col p-4 md:p-6 z-20 relative shrink-0 w-full md:w-auto ${isSidebarExpanded ? 'md:w-64' : 'md:w-24 md:items-center'} justify-between md:justify-start ${isDarkMode ? 'bg-[#10141d] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <div
          onClick={() => { if (window.innerWidth >= 768) setIsSidebarExpanded(!isSidebarExpanded) }}
          className={`flex items-center md:mb-10 md:pb-6 md:border-b cursor-pointer shrink-0 ${isSidebarExpanded ? 'gap-3' : 'gap-3 md:justify-center w-full'} ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}
          title="Toggle Sidebar"
        >
          <img
            src="/BITS_logo.png"
            alt="BIT Mesra"
            className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white/10 rounded-full p-1 shrink-0"
          />
          <div className={`flex-col ${!isSidebarExpanded ? 'flex md:hidden' : 'flex'}`}>
            <h2 className={`text-lg font-bold tracking-wide uppercase leading-tight whitespace-nowrap ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              BIT Mesra
            </h2>
            <span className={`text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${isDarkMode ? 'text-orange-500' : 'text-orange-700'}`}>
              Student Portal
            </span>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleTheme} className={`p-2.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
            {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
          <button onClick={handleLogout} className={`p-2.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-red-500' : 'bg-white border-gray-300 text-red-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>

        <div className={`hidden md:flex flex-col gap-2 w-full ${!isSidebarExpanded && 'items-center'}`}>
          <button onClick={() => setActiveTab('scan')} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'scan' ? 'bg-orange-600 border-orange-600 text-white' : isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">Scan QR</span>}
          </button>
          <button onClick={() => setActiveTab('stats')} className={`py-3 rounded-md font-bold text-sm flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'stats' ? 'bg-orange-600 border-orange-600 text-white' : isDarkMode ? 'bg-transparent border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            {isSidebarExpanded && <span className="whitespace-nowrap">My Stats</span>}
          </button>
        </div>

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

      <div className={`md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center p-1 rounded-xl border z-50 ${isDarkMode ? 'bg-[#10141d] border-gray-800' : 'bg-white border-gray-300'}`}>
        <button onClick={() => setActiveTab('scan')} className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'scan' ? 'bg-orange-600 text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          <span className={activeTab === 'scan' ? 'block' : 'hidden sm:block'}>Scan</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 ${activeTab === 'stats' ? 'bg-orange-600 text-white' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span className={activeTab === 'stats' ? 'block' : 'hidden sm:block'}>Stats</span>
        </button>
      </div>

      <div className="flex-1 p-4 pb-28 md:p-10 flex flex-col overflow-y-auto z-10 relative">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col h-full mt-2 md:mt-4">

          {activeTab === 'scan' ? (
            <div className="w-full mx-auto flex items-center justify-center h-full mt-6 md:mt-0">
              <div className={`flex flex-col items-center justify-center p-8 md:p-14 rounded-xl border w-full max-w-lg text-center ${panelClass}`}>
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-md flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                  <svg className={`w-8 h-8 md:w-10 md:h-10 ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                </div>

                <h2 className={`text-xl md:text-2xl font-bold tracking-wide mb-3 uppercase ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Session Verification</h2>
                <p className={`text-xs md:text-sm font-medium mb-8 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Initialize scanner to verify active cryptographic token. Campus network verification may be enforced by the instructor.
                </p>

                <button
                  onClick={() => navigate('/scanner')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-md font-bold w-full text-sm md:text-base flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Initialize Scanner
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col h-full relative z-10 max-w-4xl mx-auto">
              <div className={`flex flex-col p-6 md:p-10 rounded-xl border w-full ${panelClass}`}>

                <div className={`border-b pb-6 md:pb-8 mb-6 md:mb-8 flex items-start gap-4 md:gap-5 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-slate-400 overflow-hidden shrink-0 border border-transparent">
                    <img src={`https://ui-avatars.com/api/?name=${studentInfo.name}&background=ea580c&color=fff&font-size=0.4`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="pt-1 md:pt-2">
                    <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>USER PROFILE</p>
                    <h3 className={`text-xl md:text-2xl font-bold uppercase truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{studentInfo.name}</h3>
                    <p className={`text-xs md:text-sm font-medium truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{studentInfo.email}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                  <div className="w-full md:w-1/3 flex flex-col gap-6 md:gap-8">
                    <div>
                      <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>VERIFIED ATTENDANCE</p>
                      <p className={`font-bold text-3xl md:text-4xl ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>{presentCount}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] md:text-xs font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>MISSED SESSIONS</p>
                      <p className={`font-bold text-3xl md:text-4xl ${isDarkMode ? 'text-red-500' : 'text-red-600'}`}>{absentCount}</p>
                    </div>
                    <div className={`p-4 rounded-md border mt-auto ${isDarkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] font-mono mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>CALCULATED METRIC</p>
                      <p className={`font-bold text-base md:text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {presentCount + absentCount > 0
                          ? `${Math.round((presentCount / (presentCount + absentCount)) * 100)}% Compliance`
                          : 'No Data'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <div className="flex items-center justify-between mb-6 min-w-[250px]">
                      <button onClick={() => shiftMonth(-1)} className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></button>
                      <span className={`font-bold text-sm md:text-base min-w-[120px] md:min-w-[140px] text-center uppercase ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{monthNames[calMonth]} {calYear}</span>
                      <button onClick={() => shiftMonth(1)} className={`p-1.5 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></button>
                    </div>

                    {isLoadingStats ? (
                      <div className={`h-48 flex items-center justify-center font-bold text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Retrieving log...</div>
                    ) : (
                      <div className="min-w-[250px]">
                        <div className={`grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-3 text-center text-xs font-mono uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 md:gap-2">{renderCalendar()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}