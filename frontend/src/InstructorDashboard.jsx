import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacultyRecords from './FacultyRecords';
import InstructorSidebar from './InstructorSidebar';
import InstructorSessionTab from './InstructorSessionTab';
import { useTheme } from './ThemeContext';

export default function InstructorDashboard() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('generate');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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

  const bgImage = isDarkMode ? "url('/BITS_Night.png')" : "url('/BITS.png')";
  const overlayClass = isDarkMode ? "bg-[#0b101a]/90 backdrop-blur-[1px]" : "bg-[#fffaf0]/90 backdrop-blur-[1px]";

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-orange-600 selection:text-white bg-cover bg-center bg-no-repeat bg-fixed relative text-gray-200"
      style={{ backgroundImage: bgImage }}
    >
      <div className={`absolute inset-0 z-0 ${overlayClass}`}></div>

      <InstructorSidebar 
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

          {activeTab === 'generate' ? (
            <InstructorSessionTab isDarkMode={isDarkMode} />
          ) : (
            <FacultyRecords />
          )}

        </div>
      </div>
    </div>
  );
}