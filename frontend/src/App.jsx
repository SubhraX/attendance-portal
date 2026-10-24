import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import InstructorDashboard from './InstructorDashboard';
import StudentScanner from './StudentScanner';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-4">
        <nav className="mb-8 flex justify-center gap-6 bg-white p-4 rounded shadow font-semibold">
          <Link to="/" className="text-blue-600 hover:underline">Login</Link>
          <Link to="/instructor" className="text-blue-600 hover:underline">Instructor Display</Link>
          <Link to="/student" className="text-blue-600 hover:underline">Student Scanner</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/student" element={<StudentScanner />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;