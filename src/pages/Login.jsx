import React, { useState } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      console.error("Login gagal:", error);
      setErrorMsg(error.response?.data?.message || "Username / Email atau Password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a5c36] font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Header Logo & Judul */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-sm">
            <img src="/logo.png" alt="SIPUS Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">SIPUS Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Sistem Informasi Manajemen Perpustakaan</p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Username / Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-gray-400" size={18} />
              <input 
                type="text" 
                required
                placeholder="masukkan username/email..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-gray-400" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#0a5c36] text-white rounded-xl font-bold text-sm hover:bg-[#08482a] active:scale-95 transition-all shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'MEMERIKSA KREDENSIAL...' : 'MASUK KE SISTEM'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Akses terbatas untuk pustakawan dan staf terdaftar.
        </div>
      </div>
    </div>
  );
}