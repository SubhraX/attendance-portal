import { useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useTheme } from './ThemeContext';
import AttendanceGraph from './components/AttendanceGraph';
import AttendanceCalendar from './components/AttendanceCalendar';
import StudentProfileSidebar from './components/StudentProfileSidebar';
import EditStudentForm from './components/EditStudentForm';

export default function StudentDetailsModal({ student, onClose, onUpdate }) {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [currentStudent, setCurrentStudent] = useState(student);

  const [isModalLoading, setIsModalLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(student.profileImage || null);

  const [attendanceData, setAttendanceData] = useState({});
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}`, {
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
        console.error("Failed to fetch student attendance:", error);
      } finally {
        setIsModalLoading(false);
      }
    };
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent._id]);

  const handleResetDevice = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/reset-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId: currentStudent._id })
      });
      if (res.ok) {
        showToast("Device lock reset.");
        setCurrentStudent({ ...currentStudent, deviceId: null });
        onUpdate();
      }
    } catch (error) {
      console.error("Error unlocking device:", error);
    }
  };

  const handleDeleteAttendanceOnly = async () => {
    if (!window.confirm("Confirm: Wipe ALL attendance records for this student?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/attendance/student/${currentStudent._id}/records`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Records cleared.");
        setAttendanceData({});
      }
    } catch (error) {
      console.error("Error deleting attendance:", error);
    }
  };

  const handleRemoveStudent = async () => {
    if (!window.confirm("Confirm: Delete student profile entirely?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${currentStudent._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Student deleted.");
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

  const modalBg = isDarkMode ? 'bg-[#121826] border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  const cardBg = isDarkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-gray-50 border-gray-200';
  const customScrollbar = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-gray-600/80`;

  // Stats for Currently Viewed Month (Existing)
  const presentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key); return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'present';
  }).length;
  const absentCount = Object.keys(attendanceData).filter(key => {
    const d = new Date(key); return d.getMonth() === calMonth && d.getFullYear() === calYear && attendanceData[key] === 'absent';
  }).length;
  const totalSessions = presentCount + absentCount;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  // NEW: Calculate Trend (Current Month vs Previous Month)
  const prevMonth = calMonth === 0 ? 11 : calMonth - 1;
  const prevYear = calMonth === 0 ? calYear - 1 : calYear;

  let prevMonthPresent = 0;
  let prevMonthAbsent = 0;
  Object.keys(attendanceData).forEach(key => {
    const d = new Date(key);
    if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
      if (attendanceData[key] === 'present') prevMonthPresent++;
      else if (attendanceData[key] === 'absent') prevMonthAbsent++;
    }
  });
  const prevTotal = prevMonthPresent + prevMonthAbsent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 md:p-8">
      <div className={`w-full max-w-[1000px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${modalBg}`}>

        {/* Header */}
        <div className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className="text-base font-bold uppercase tracking-widest">Student Record</h3>
          <button onClick={onClose} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 ${isDarkMode ? 'bg-[#121826]' : 'bg-white'} ${customScrollbar}`}>

          {/* Left Column (Info & Actions) */}
          <StudentProfileSidebar 
            student={currentStudent}
            profileImage={profileImage}
            isDarkMode={isDarkMode}
            prevTotal={prevTotal}
            prevMonthPresent={prevMonthPresent}
            prevMonthAbsent={prevMonthAbsent}
            presentCount={presentCount}
            absentCount={absentCount}
            onEditClick={() => setIsEditing(true)}
            onResetDevice={handleResetDevice}
            onDeleteAttendance={handleDeleteAttendanceOnly}
            onRemoveStudent={handleRemoveStudent}
          />

          {/* Right Column (Calendar & Graph) */}
          <div className={`w-full md:w-2/3 border rounded-xl p-6 flex flex-col shadow-sm ${cardBg}`}>

            <AttendanceCalendar 
              studentId={currentStudent._id}
              attendanceData={attendanceData}
              setAttendanceData={setAttendanceData}
              calYear={calYear}
              setCalYear={setCalYear}
              calMonth={calMonth}
              setCalMonth={setCalMonth}
              isModalLoading={isModalLoading}
              isDarkMode={isDarkMode}
            />

            {/* SEPARATED COMPONENT: Attendance Graph */}
            <AttendanceGraph
              attendanceData={attendanceData}
              calYear={calYear}
              calMonth={calMonth}
              isDarkMode={isDarkMode}
              attendanceRate={attendanceRate}
            />

          </div>
        </div>

      </div>

      {isEditing && (
        <EditStudentForm 
          student={currentStudent}
          initialProfileImage={profileImage}
          isDarkMode={isDarkMode}
          showToast={showToast}
          onCancel={() => setIsEditing(false)}
          onSave={(updatedStudent) => {
            setCurrentStudent(updatedStudent);
            setProfileImage(updatedStudent.profileImage);
            setIsEditing(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}