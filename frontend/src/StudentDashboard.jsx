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
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className={`h-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}></div>);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateString];
      
      let styleClass = isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'; 
      if (status === 'present') styleClass = 'bg-green-600 text-white font-bold';
      else if (status === 'absent') styleClass = 'bg-red-600 text-white font-bold';

      days.push(
        <div key={day} className={`h-8 flex items-center justify-center text-xs border-r border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${styleClass}`}>
          {day}
        </div>
      );
    }
    return days;
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;

  const appBg = isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900';
  const sidebarBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300';
  const contentBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans ${appBg}`}>
      
      {/* Sidebar */}
      <div className={`md:w-56 shrink-0 border-r border-b md:border-b-0 flex flex-col ${sidebarBg}`}>
        <div className="p-4 border-b flex items-center gap-3">
          <img src="/BITS_logo.png" alt="Logo" className="w-8 h-8 object-contain bg-white rounded-sm p-0.5" />
          <div>
            <h2 className="text-sm font-bold uppercase">BIT Mesra</h2>
            <p className="text-[10px] uppercase text-gray-500">Student ERP Portal</p>
          </div>
        </div>

        <div className="flex-1 py-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible px-2">
          <button onClick={() => setActiveTab('scan')} className={`px-3 py-2 text-sm text-left rounded-sm transition-colors ${activeTab === 'scan' ? 'bg-blue-600 text-white' : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>Scanner</button>
          <button onClick={() => setActiveTab('stats')} className={`px-3 py-2 text-sm text-left rounded-sm transition-colors ${activeTab === 'stats' ? 'bg-blue-600 text-white' : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>Attendance Records</button>
        </div>

        <div className="p-2 border-t flex flex-col gap-1 mt-auto">
          <button onClick={toggleTheme} className={`px-3 py-2 text-xs text-left rounded-sm ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>Toggle Theme</button>
          <button onClick={handleLogout} className={`px-3 py-2 text-xs text-left rounded-sm text-red-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-4 md:p-6 overflow-y-auto ${contentBg}`}>
        <div className="max-w-5xl mx-auto">
          
          {activeTab === 'scan' ? (
            <div className={`border rounded-sm p-6 ${cardBg}`}>
              <h2 className="text-lg font-bold border-b pb-2 mb-4">Session Verification</h2>
              <p className="text-sm mb-6 text-gray-500">Initialize scanner to verify cryptographic token. Device hardware requirements strictly enforced.</p>
              <button onClick={() => navigate('/scanner')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm text-sm font-medium">
                Initialize Scanner Camera
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Profile Card */}
              <div className={`border rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${cardBg}`}>
                <div className="w-12 h-12 bg-gray-300 rounded-sm overflow-hidden shrink-0">
                  <img src={`https://ui-avatars.com/api/?name=${studentInfo.name}&background=0D8ABC&color=fff&font-size=0.4`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase">{studentInfo.name}</h3>
                  <p className="text-xs text-gray-500">{studentInfo.email}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Stats Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className={`border rounded-sm p-4 ${cardBg}`}>
                    <p className="text-xs uppercase text-gray-500 mb-1">Present Count</p>
                    <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  </div>
                  <div className={`border rounded-sm p-4 ${cardBg}`}>
                    <p className="text-xs uppercase text-gray-500 mb-1">Absent Count</p>
                    <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  </div>
                  <div className={`border rounded-sm p-4 ${cardBg}`}>
                    <p className="text-xs uppercase text-gray-500 mb-1">Compliance Metric</p>
                    <p className="text-lg font-bold">
                      {presentCount + absentCount > 0 ? `${Math.round((presentCount / (presentCount + absentCount)) * 100)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Calendar Area */}
                <div className={`lg:col-span-2 border rounded-sm p-4 overflow-x-auto ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => shiftMonth(-1)} className="px-2 py-1 text-sm border rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600">&lt; Prev</button>
                    <span className="font-bold text-sm uppercase">{monthNames[calMonth]} {calYear}</span>
                    <button onClick={() => shiftMonth(1)} className="px-2 py-1 text-sm border rounded-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600">Next &gt;</button>
                  </div>
                  
                  {isLoadingStats ? (
                    <div className="h-32 flex items-center justify-center text-sm text-gray-500">Retrieving records...</div>
                  ) : (
                    <div className={`border-t border-l flex flex-col min-w-[250px] ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                          <div key={d} className={`h-8 flex items-center justify-center text-xs font-bold border-r ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7">
                        {renderCalendar()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}