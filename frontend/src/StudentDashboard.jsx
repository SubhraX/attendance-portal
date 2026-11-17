import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import StudentSidebar from './components/StudentSidebar';
import StudentStatsTab from './components/StudentStatsTab';
import StudentScanTab from './components/StudentScanTab';

export default function StudentDashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState('scan');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Data State
  const [studentInfo, setStudentInfo] = useState({ name: 'Student', email: '' });
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Calendar State
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // 1. Load User Profile on Mount & Sync Fresh Data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setStudentInfo(parsedUser); // Load stale data immediately for fast UI
      
      // Silently fetch fresh profile data in the background
      const syncProfile = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${parsedUser._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const freshData = await res.json();
            setStudentInfo(freshData); // Update state instantly
            localStorage.setItem('user', JSON.stringify(freshData)); // Save back to local storage
          }
        } catch (error) {
          console.error("Failed to sync fresh profile:", error);
        }
      };
      
      syncProfile();
    }
  }, []);

  // 2. Fetch Stats only when viewing the Stats Tab
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

  // Theming Constants
  const bgImage = isDarkMode ? "url('/BITS_Night.png')" : "url('/BITS.png')";
  const overlayClass = isDarkMode ? "bg-[#0b101a]/90 backdrop-blur-sm" : "bg-[#fffaf0]/90 backdrop-blur-sm";

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-orange-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed relative text-gray-200"
      style={{ backgroundImage: bgImage }}
    >
      <div className={`absolute inset-0 z-0 ${overlayClass}`}></div>

      <StudentSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />

      <div className="flex-1 p-4 pb-28 md:p-10 flex flex-col overflow-y-auto z-10 relative">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col h-full mt-2 md:mt-4">

          {activeTab === 'scan' ? (
            <StudentScanTab isDarkMode={isDarkMode} />
          ) : (
            <StudentStatsTab
              studentInfo={studentInfo}
              attendanceData={attendanceData}
              isLoadingStats={isLoadingStats}
              calYear={calYear}
              calMonth={calMonth}
              isDarkMode={isDarkMode}
              onMonthChange={shiftMonth}
            />
          )}

        </div>
      </div>
    </div>
  );
}