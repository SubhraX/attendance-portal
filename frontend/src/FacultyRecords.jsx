import { useState, useEffect } from 'react';

export default function FacultyRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = filterDate 
        ? `https://attendance-portal-p2lp.onrender.com/api/attendance/history?date=${filterDate}`
        : `https://attendance-portal-p2lp.onrender.com/api/attendance/history`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRecords(data.records);
    } catch (error) {
      console.error("Failed to fetch records", error);
    }
    setLoading(false);
  };

  const handleResetDevice = async (studentId, studentName) => {
    if (!window.confirm(`Reset device lock for ${studentName}? They will need to log in again on their new device.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://attendance-portal-p2lp.onrender.com/api/auth/reset-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId })
      });
      const data = await res.json();
      
      setMessage(res.ok ? `✅ ${studentName}'s device unlocked.` : `❌ ${data.message}`);
      setTimeout(() => setMessage(''), 3000);
      
      if (res.ok) fetchRecords(); // Refresh to reflect any changes
    } catch (error) {
      setMessage('❌ Failed to reset device');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full max-w-5xl mx-auto text-white">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold tracking-wide">Attendance Records</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400 font-medium">Filter by Date:</label>
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={() => setFilterDate('')} 
            className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Date & Time</th>
              <th className="px-6 py-4 font-medium">Student Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium text-center">Device Lock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading records...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No attendance records found for this date.</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-300">
                    {new Date(record.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{record.student?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-slate-400">{record.student?.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    {record.student?.deviceId ? (
                      <button 
                        onClick={() => handleResetDevice(record.student._id, record.student.name)}
                        className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Reset Device
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No Device Locked</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}