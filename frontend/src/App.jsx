import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './ToastContext'; // Import the provider
import Login from './Login';
import InstructorDashboard from './InstructorDashboard';
import StudentScanner from './StudentScanner';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/student" element={<StudentScanner />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;