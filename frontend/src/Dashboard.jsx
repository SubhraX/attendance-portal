import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function InstructorDashboard() {
  const [token, setToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const classId = 'CS101'; // Hardcoded for testing

  const startSession = async () => {
    const authToken = localStorage.getItem('token');
    
    const res = await fetch('http://localhost:5000/api/attendance/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ classId })
    });
    
    if(res.ok) {
      const socket = new WebSocket('ws://localhost:5000');
      socket.onopen = () => {
        socket.send(JSON.stringify({ action: 'startRotation', classId }));
      };
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_QR_TOKEN') {
          setToken(data.token);
          setTimeLeft(30); 
        }
      };
    } else {
      alert("Failed to start session. Ensure you are logged in as an Instructor.");
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  return (
    <div className="p-6 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Instructor Dashboard</h2>
      <button onClick={startSession} className="bg-blue-800 text-white px-6 py-3 rounded text-lg font-bold">
        Start Attendance Session
      </button>
      
      {token && (
        <div className="mt-8 text-center bg-white p-6 shadow-lg rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Scan with Student Portal</h3>
          <div className="flex justify-center p-4 border-4 border-blue-600 rounded inline-block">
             <QRCode value={JSON.stringify({ classId, token })} size={300} />
          </div>
          <p className="text-red-600 font-extrabold mt-4 text-3xl">
            Refreshes in: {timeLeft}s
          </p>
        </div>
      )}
    </div>
  );
}