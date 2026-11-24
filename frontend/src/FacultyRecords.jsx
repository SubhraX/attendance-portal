import { useState, useEffect } from 'react';
import RegisterStudentModal from './RegisterStudentModal';
import StudentDetailsModal from './StudentDetailsModal';
import FacultyFilterBar from './components/FacultyFilterBar';
import StudentCard from './components/StudentCard';
import { useTheme } from './ThemeContext';

export const STREAM_SECTIONS = {
  "CSE": ["G", "H", "I", "J"],
  "CSE(AIML)": ["K"],
  "ECE": ["A", "B", "C", "D"],
  "EEE": ["E", "F"],
  "ME": ["R", "S"],
  "CE": ["M"],
  "PIE": ["L"],
  "Chemical": ["N", "O"],
  "BT": ["P"],
  "FET": ["Q"]
};
export const STREAMS = Object.keys(STREAM_SECTIONS);

export default function FacultyRecords() {
  const { isDarkMode } = useTheme();
  
  // Data State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState({ stream: 'All Streams', year: 'All', section: 'All' });
  
  // Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = false;
    if (selectedFilter.stream === 'All Streams') {
      matchesFilter = true;
    } else {
      const isSameStream = s.stream === selectedFilter.stream;
      const isSameYear = selectedFilter.year === 'All' || Number(s.admissionYear) === Number(selectedFilter.year);
      const isSameSection = selectedFilter.section === 'All' || s.section === selectedFilter.section;
      matchesFilter = isSameStream && isSameYear && isSameSection;
    }
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full flex flex-col h-full relative z-10">
      
      <FacultyFilterBar 
        students={students}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        setShowRegModal={setShowRegModal}
        isDarkMode={isDarkMode}
      />

      {loading ? (
        <div className={`flex-1 flex items-center justify-center font-bold text-sm ${isDarkMode ? 'text-gray-400' : 'text-orange-900/50'}`}>
          Loading data...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-10">
          {filteredStudents.length === 0 ? (
            <div className={`col-span-full text-center py-10 border border-dashed rounded-2xl text-sm ${isDarkMode ? 'text-gray-500 border-white/20' : 'text-orange-900/50 font-medium border-orange-200'}`}>
              No students found.
            </div>
          ) : (
            filteredStudents.map((student, idx) => (
              <StudentCard 
                key={student._id}
                student={student}
                index={idx}
                isDarkMode={isDarkMode}
                onClick={() => setSelectedStudent(student)}
              />
            ))
          )}
        </div>
      )}

      {showRegModal && (
        <RegisterStudentModal onClose={() => setShowRegModal(false)} onSuccess={fetchStudents} />
      )}
      
      {selectedStudent && (
        <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={fetchStudents} />
      )}
    </div>
  );
}