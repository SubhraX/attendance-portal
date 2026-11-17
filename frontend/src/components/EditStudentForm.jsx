import { useState } from 'react';
import { STREAMS, STREAM_SECTIONS } from './FacultyRecords';

export default function EditStudentForm({ 
  student, 
  initialProfileImage, 
  isDarkMode, 
  showToast, 
  onCancel, 
  onSave 
}) {
  const [editForm, setEditForm] = useState({ 
    name: student.name, 
    email: student.email, 
    password: '',
    stream: student.stream || STREAMS[0],
    section: student.section || STREAM_SECTIONS[STREAMS[0]][0]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(initialProfileImage);

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setProfileImage(localUrl);

    const img = new Image();
    img.src = localUrl;
    
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 256;
      let { width, height } = img;
      
      if (width > height) {
        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
      } else {
        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('profileImage', blob, 'avatar.webp');

        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${student._id}/image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });

          const data = await res.json();
          if (res.ok) {
            showToast("Profile image uploaded successfully.");
            // Pass the new image URL up to the parent immediately
            onSave({ ...student, profileImage: data.profileImage }); 
          } else {
            showToast(data.message || "Upload failed.");
            setProfileImage(initialProfileImage);
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          showToast("Network error during upload.");
          setProfileImage(initialProfileImage);
        }
      }, 'image/webp', 0.8);
    };
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...editForm };
      
      if (editForm.password && editForm.password.trim() !== '') payload.password = editForm.password;
      else if (student.password) payload.password = student.password;
      
      const res = await fetch(`https://attendance-portal-p2lp.onrender.com/api/auth/student/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast("Record updated successfully.");
        onSave({ ...student, name: editForm.name, email: editForm.email, stream: editForm.stream, section: editForm.section });
      } else {
        const data = await res.json();
        showToast(data.message || "Update failed. Check required fields.");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      showToast("Network error. Could not update profile.");
    }
  };

  const inputClass = `w-full border px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${isDarkMode ? 'bg-[#0f172a] border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const modalBg = isDarkMode ? 'bg-[#121826] border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 border ${modalBg}`}>
        
        <h3 className="text-base font-bold uppercase tracking-widest mb-6 border-b pb-4 border-gray-200/20">
          Edit Student Info
        </h3>
        
        <div className="flex justify-center mb-6">
           <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden ring-4 ring-transparent group-hover:ring-orange-500/20 transition-all">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(editForm.name)
                )}
              </div>
              <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
        </div>

        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} placeholder="Full Name" />
          <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} placeholder="Email Address" />
          
          <div className="flex gap-2">
            <select value={editForm.stream} onChange={e => setEditForm({ ...editForm, stream: e.target.value, section: STREAM_SECTIONS[e.target.value]?.[0] || 'Unassigned' })} className={inputClass}>
              {STREAMS.map(stream => <option key={stream} value={stream}>{stream}</option>)}
            </select>
            <select value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} className={inputClass}>
              {STREAM_SECTIONS[editForm.stream]?.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>
          
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="New Password (Optional)" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200/20">
            <button type="button" onClick={onCancel} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>Cancel</button>
            <button type="submit" className="bg-orange-600 text-white font-medium text-sm px-6 py-2 rounded-lg hover:bg-orange-500 shadow-md">Save Changes</button>
          </div>
        </form>
        
      </div>
    </div>
  );
}