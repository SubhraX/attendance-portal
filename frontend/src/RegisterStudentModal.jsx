import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';

export default function StudentDashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('scan'); 
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
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={`h-10 rounded-md ${isDarkMode ? 'bg-[#0f172a]/50' : 'bg-gray-50/50'}`}></div>);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];
      
      let styleClass = isDarkMode ? 'bg-[#1e293b] text-gray-300' : 'bg-gray-100 text-gray-600'; 
      if (status === 'present') styleClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/50';
      else if (status === 'absent') styleClass = 'bg-red-500/10 text-red-600 dark:text-red-400 font-semibold ring-1 ring-red-500/50';

      days.push(
        <div key={day} className={`h-10 flex items-center justify-center text-sm rounded-md transition-colors ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;

  const appBg = isDarkMode ? 'bg-[#0f172a] text-gray-200' : 'bg-gray-50 text-gray-900';
  const sidebarBg = isDarkMode ? 'bg-[#1e293b] border-gray-800' : 'bg-white border-gray-200';
  const cardBg = isDarkMode ? 'bg-[#1e293b] border-gray-800' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans ${appBg}`}>
      
      {/* Sidebar */}
      <div className={`md:w-64 shrink-0 border-r border-b md:border-b-0 flex flex-col ${sidebarBg}`}>
        <div className="p-6 border-b border-inherit flex items-center gap-3">
          <img src="/BITS_logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide">BIT Mesra</h2>
            <p className="text-[11px] font-medium uppercase tracking-wider text-orange-600">Student Portal</p>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          <button onClick={() => setActiveTab('scan')} className={`px-4 py-2.5 text-sm font-medium text-left rounded-lg transition-colors ${activeTab === 'scan' ? 'bg-orange-600 text-white' : isDarkMode ? 'hover:bg-[#0f172a] text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
            QR Scanner
          </button>
          <button onClick={() => setActiveTab('stats')} className={`px-4 py-2.5 text-sm font-medium text-left rounded-lg transition-colors ${activeTab === 'stats' ? 'bg-orange-600 text-white' : isDarkMode ? 'hover:bg-[#0f172a] text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
            My Attendance
          </button>
        </div>

        <div className="p-4 border-t border-inherit flex flex-col gap-2 mt-auto">
          <button onClick={toggleTheme} className={`px-4 py-2.5 text-sm font-medium text-left rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#0f172a] text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            Toggle Theme
          </button>
          <button onClick={handleLogout} className={`px-4 py-2.5 text-sm font-medium text-left rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          
          {activeTab === 'scan' ? (
            <div className={`border rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm ${cardBg}`}>
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${isDarkMode ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-orange-600'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Session Verification</h2>
              <p className={`text-sm max-w-md mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Initialize the secure scanner to verify your cryptographic token. Hardware and network requirements are strictly enforced by the faculty.</p>
              <button onClick={() => navigate('/scanner')} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                Launch Camera
              </button>
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className={`border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm ${cardBg}`}>
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 ring-4 ring-orange-500/10">
                  <img src={`https://ui-avatars.com/api/?name=${studentInfo.name}&background=ea580c&color=fff&font-size=0.4`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold uppercase">{studentInfo.name}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{studentInfo.email}</p>
                </div>
              </div>

              {/* Data Layout */}
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Stats Sidebar */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <div className={`border rounded-2xl p-6 shadow-sm ${cardBg}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Verified Scans</p>
                    <p className="text-4xl font-extrabold text-emerald-500">{presentCount}</p>
                  </div>
                  <div className={`border rounded-2xl p-6 shadow-sm ${cardBg}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Missed Sessions</p>
                    <p className="text-4xl font-extrabold text-red-500">{absentCount}</p>
                  </div>
                  <div className={`border rounded-2xl p-6 shadow-sm mt-auto ${isDarkMode ? 'bg-[#0f172a]/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Calculated Compliance</p>
                    <p className="text-2xl font-bold">
                      {presentCount + absentCount > 0 ? `${Math.round((presentCount / (presentCount + absentCount)) * 100)}%` : 'No Data'}
                    </p>
                  </div>
                </div>

                {/* Calendar Area */}
                <div className={`flex-1 border rounded-2xl p-6 overflow-x-auto shadow-sm ${cardBg}`}>
                  <div className="flex items-center justify-between mb-6 min-w-[300px]">
                    <button onClick={() => shiftMonth(-1)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <span className="font-bold text-sm uppercase tracking-wide">{monthNames[calMonth]} {calYear}</span>
                    <button onClick={() => shiftMonth(1)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                  
                  {isLoadingStats ? (
                    <div className="h-48 flex items-center justify-center text-sm text-gray-500 font-medium animate-pulse">Syncing ledger...</div>
                  ) : (
                    <div className="min-w-[300px]">
                      <div className={`grid grid-cols-7 gap-2 mb-3 text-center text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {renderCalendar()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}