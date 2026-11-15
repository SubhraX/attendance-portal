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
      console.error("Failed to fetch stats");
    }
    setIsLoadingStats(false);
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
    } catch (e) {} 
    
    localStorage.clear();
    navigate('/login');
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
        styleClass = 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] rounded-xl';
      } else if (status === 'absent') {
        styleClass = 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] rounded-xl';
      }

      days.push(
        <div key={day} className={`h-10 flex items-center justify-center text-sm font-bold transition-all cursor-default ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;

  const bgImage = isDarkMode ? "url('/BITS_Night.png')" : "url('/BITS.png')";
  const overlayClass = isDarkMode ? "bg-[#0b101a]/80 backdrop-blur-md" : "bg-[#fffaf0]/80 backdrop-blur-md";
  const glassPanel = isDarkMode ? "bg-[#161b26]/60 border-white/10" : "bg-white/60 border-orange-200/50";

  return (
    <div 
      className={`min-h-screen flex flex-col md:flex-row font-sans selection:bg-orange-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed relative text-gray-200`}
      style={{ backgroundImage: bgImage }}
    >
      <div className={`absolute inset-0 z-0 ${overlayClass}`}></div>
      
      {/* HEADER / SIDEBAR - Animation Classes Restored */}
      <div className={`md:border-r border-b flex flex-row md:flex-col p-4 md:p-6 shadow-2xl z-20 relative backdrop-blur-xl shrink-0 transition-all duration-300 ease-in-out w-full ${isSidebarExpanded ? 'md:w-64' : 'md:w-24 md:items-center'} justify-between md:justify-start ${isDarkMode ? 'bg-[#10141d]/80 border-white/10' : 'bg-white/80 border-orange-200/50'}`}>
        
        {/* Logo & Title */}
        <div 
          onClick={() => { if(window.innerWidth >= 768) setIsSidebarExpanded(!isSidebarExpanded) }}
          className={`flex items-center md:mb-10 md:pb-6 md:border-b cursor-pointer group shrink-0 transition-all duration-300 ${isSidebarExpanded ? 'gap-3' : 'gap-3 md:justify-center w-full'} ${isDarkMode ? 'border-white/10' : 'border-orange-200/50'}`}
          title="Toggle Sidebar"
        >
          <img 
            src="/BITS_logo.png" 
            alt="BIT Mesra" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md bg-white/10 rounded-full p-1 shrink-0 group-hover:scale-110 transition-transform"
          />
          <div className={`flex-col animate-fade-in-up ${!isSidebarExpanded ? 'flex md:hidden' : 'flex'}`}>
            <h2 className={`text-lg font-extrabold tracking-wide uppercase leading-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>
              BIT Mesra
            </h2>
            <span className={`text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-orange-600'}`}>
              Student Panel
            </span>
          </div>
        </div>

        {/* MOBILE ONLY: Theme & Logout Buttons */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleTheme} className={`p-2.5 rounded-xl border transition-all active:scale-95 ${isDarkMode ? 'bg-black/20 border-white/10 text-gray-300' : 'bg-white/50 border-orange-200 text-orange-900'}`}>
            {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
          <button onClick={handleLogout} className={`p-2.5 rounded-xl border transition-all active:scale-95 ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>

        {/* DESKTOP ONLY: Sidebar Tabs (Animations perfectly restored) */}
        <div className={`hidden md:flex flex-col gap-4 w-full ${!isSidebarExpanded && 'items-center'}`}>
          <button onClick={() => setActiveTab('scan')} className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'scan' ? 'bg-orange-600 border-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' : isDarkMode ? 'bg-black/20 border-orange-600/50 text-orange-500 hover:bg-orange-600/10' : 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">Scan QR</span>}
          </button>
          <button onClick={() => setActiveTab('stats')} className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${activeTab === 'stats' ? 'bg-orange-600 border-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' : isDarkMode ? 'bg-black/20 border-orange-600/50 text-orange-500 hover:bg-orange-600/10' : 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">My Stats</span>}
          </button>
        </div>

        {/* DESKTOP ONLY: Theme & Logout (Bottom) */}
        <div className={`hidden md:flex mt-auto pt-6 border-t flex-col gap-4 w-full ${!isSidebarExpanded && 'items-center'} ${isDarkMode ? 'border-white/10' : 'border-orange-200/50'}`}>
          <button onClick={toggleTheme} className={`py-3 rounded-xl font-semibold transition-all duration-300 flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${isDarkMode ? 'bg-black/20 border-white/10 text-gray-300 hover:bg-white/5' : 'bg-white/50 border-orange-200 text-orange-900 hover:bg-orange-50'}`}>
            {isDarkMode ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">Theme</span>}
          </button>
          <button onClick={handleLogout} className={`py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center border ${isSidebarExpanded ? 'px-4 gap-3 w-full' : 'w-12 justify-center'} ${isDarkMode ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'}`}>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {isSidebarExpanded && <span className="animate-fade-in-up whitespace-nowrap">Log Out</span>}
          </button>
        </div>
      </div>

      {/* MOBILE ONLY: Floating Bottom Hover Panel */}
      <div className={`md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center p-1.5 rounded-[2rem] border shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-2xl z-50 ${isDarkMode ? 'bg-[#10141d]/90 border-white/10' : 'bg-white/95 border-orange-200'}`}>
        <button onClick={() => setActiveTab('scan')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2.5 ${activeTab === 'scan' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-900/70 hover:text-orange-900'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          <span className={activeTab === 'scan' ? 'block' : 'hidden sm:block'}>Scan QR</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2.5 ${activeTab === 'stats' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-orange-900/70 hover:text-orange-900'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span className={activeTab === 'stats' ? 'block' : 'hidden sm:block'}>My Stats</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 pb-28 md:p-10 flex flex-col overflow-y-auto z-10 relative transition-all duration-300">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col h-full mt-2 md:mt-4">
          
          {activeTab === 'scan' ? (
            <div className="w-full mx-auto flex items-center justify-center h-full mt-6 md:mt-0">
              <div className={`flex flex-col items-center justify-center p-8 md:p-14 rounded-3xl border shadow-2xl backdrop-blur-xl animate-fade-in-up w-full max-w-lg text-center ${glassPanel}`}>
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-8 border ${isDarkMode ? 'bg-black/40 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                  <svg className={`w-10 h-10 md:w-12 md:h-12 ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                </div>
                
                <h2 className={`text-2xl md:text-3xl font-extrabold tracking-wide mb-4 ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>Mark Attendance</h2>
                <p className={`text-xs md:text-sm font-medium mb-10 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-orange-900/70'}`}>
                  Click below to open your device camera and scan the secure QR token. Ensure you are connected to the campus Wi-Fi if network locking is enabled by your instructor.
                </p>

                <button 
                  onClick={() => navigate('/scanner')} 
                  className="bg-orange-600 hover:bg-orange-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold shadow-[0_0_20px_rgba(234,88,12,0.4)] transition-all w-full active:scale-95 text-base md:text-lg flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Launch Scanner
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col h-full relative z-10 max-w-4xl mx-auto">
              <div className={`flex flex-col p-6 md:p-10 rounded-3xl border shadow-2xl backdrop-blur-xl animate-fade-in-up w-full ${glassPanel}`}>
                
                <div className={`border-b pb-6 md:pb-8 mb-6 md:mb-8 flex items-start gap-4 md:gap-5 ${isDarkMode ? 'border-white/10' : 'border-orange-200/50'}`}>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-400 overflow-hidden shrink-0 border-2 border-transparent shadow-lg">
                    <img src={`https://ui-avatars.com/api/?name=${studentInfo.name}&background=ea580c&color=fff&font-size=0.4`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="pt-1 md:pt-2">
                    <p className={`text-[10px] md:text-xs uppercase tracking-widest font-bold mb-1 ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}>My Profile</p>
                    <h3 className={`text-xl md:text-3xl font-extrabold tracking-wide uppercase truncate ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{studentInfo.name}</h3>
                    <p className={`text-xs md:text-sm font-medium truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-orange-700/80'}`}>{studentInfo.email}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                  <div className="w-full md:w-1/3 flex flex-col gap-6 md:gap-8">
                    <div>
                      <p className={`text-[10px] md:text-xs uppercase tracking-wider font-bold mb-2 ${isDarkMode ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>Total Present</p>
                      <p className={`font-extrabold text-3xl md:text-4xl drop-shadow-md ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{presentCount}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] md:text-xs uppercase tracking-wider font-bold mb-2 ${isDarkMode ? 'text-red-500/70' : 'text-red-600/70'}`}>Total Absent</p>
                      <p className={`font-extrabold text-3xl md:text-4xl drop-shadow-md ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{absentCount}</p>
                    </div>
                    <div className={`p-4 rounded-xl border mt-auto ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-orange-50 border-orange-200/50'}`}>
                      <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50'}`}>Overall Progress</p>
                      <p className={`font-bold text-base md:text-lg ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>
                        {presentCount + absentCount > 0 
                          ? `${Math.round((presentCount / (presentCount + absentCount)) * 100)}% Attendance` 
                          : 'No Classes Yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <div className="flex items-center justify-between mb-6 min-w-[250px]">
                      <button onClick={() => shiftMonth(-1)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-orange-900/40 hover:text-orange-950 hover:bg-orange-900/5'}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></button>
                      <span className={`font-bold text-lg md:text-xl min-w-[120px] md:min-w-[140px] text-center tracking-wide ${isDarkMode ? 'text-white' : 'text-orange-950'}`}>{monthNames[calMonth]} {calYear}</span>
                      <button onClick={() => shiftMonth(1)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-orange-900/40 hover:text-orange-950 hover:bg-orange-900/5'}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></button>
                    </div>
                    
                    {isLoadingStats ? (
                      <div className={`h-48 flex items-center justify-center font-bold ${isDarkMode ? 'text-gray-500' : 'text-orange-900/50'}`}>Loading calendar...</div>
                    ) : (
                      <div className="min-w-[250px]">
                        <div className={`grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-3 text-center text-xs md:text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-orange-900/70'}`}>
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