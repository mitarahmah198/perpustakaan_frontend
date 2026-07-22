import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Key, CheckCircle, Edit3, Save, X, Lock } from 'lucide-react';
import profileService from '../services/profileService';
import BadgeStatus from '../components/BadgeStatus';

export default function Profil() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    username: '',
    role: 'Staf Perpustakaan',
    status: 'AKTIF',
  });

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePassword, setIsChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [successNotif, setSuccessNotif] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch profil dari backend
  const fetchProfile = async () => {
    try {
      const response = await profileService.getProfile();
      const user = response.data?.data || response.data || {};

      setProfile({
        name: user.name || 'Staf Perpustakaan',
        email: user.email || 'petugas@sipus.edu',
        username: user.username || 'staf_sipus',
        role: user.role || 'Staf Perpustakaan',
        status: user.status || 'AKTIF',
      });

      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
      });

      setLoading(false);
    } catch (error) {
      console.error("Gagal memuat profil pengguna:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEdit = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      username: profile.username,
      password: '',
      confirmPassword: '',
    });
    setErrorMessage('');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isChangePassword) {
      if (formData.password.length < 6) {
        setErrorMessage('Password baru minimal 6 karakter!');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Konfirmasi password tidak cocok!');
        return;
      }
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
      };

      if (isChangePassword && formData.password) {
        payload.password = formData.password;
      }

      await profileService.updateProfile(payload);

      setSuccessNotif('Profil berhasil diperbarui dan tersimpan di database!');
      setIsEditing(false);
      setIsChangePassword(false);
      fetchProfile();

      setTimeout(() => setSuccessNotif(''), 4000);
    } catch (error) {
      console.error("Gagal memperbarui profil:", error);
      setErrorMessage(error.response?.data?.message || "Terjadi kesalahan saat menyimpan profil.");
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">
        Memuat data profil...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0a5c36]">Profil Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data profil dan kredensial akun login Anda.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleOpenEdit}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a5c36] text-white rounded-xl text-xs font-bold hover:bg-[#08482a] shadow-sm transition-all active:scale-95"
          >
            <Edit3 size={16} /> EDIT PROFIL
          </button>
        )}
      </div>

      {successNotif && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successNotif}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <Lock size={20} />
          <span className="text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Kartu Profil Utama */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        
        {/* Header Profil */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0a5c36&color=fff`} 
            className="w-20 h-20 rounded-full border-2 border-emerald-100 shadow-sm" 
            alt="Profile Avatar" 
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
            <p className="text-sm text-gray-500 font-mono">@{profile.username || 'username'}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-[#0a5c36] border border-emerald-200 text-xs font-bold rounded-full uppercase">
                {profile.role}
              </span>
              <BadgeStatus status={profile.status} />
            </div>
          </div>
        </div>

        {/* Form Edit vs Mode View */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nama Lengkap</label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Username Login</label>
                <input 
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>
            </div>

            {/* Opsi Ubah Password */}
            <div className="pt-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setIsChangePassword(!isChangePassword)}
                className="text-xs font-bold text-[#0a5c36] hover:underline flex items-center gap-1 mb-3"
              >
                <Key size={14} /> {isChangePassword ? 'Sembunyikan Form Password' : '+ Ubah Password Login'}
              </button>

              {isChangePassword && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Password Baru</label>
                    <input 
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0a5c36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Konfirmasi Password Baru</label>
                    <input 
                      type="password"
                      placeholder="Ulangi password baru"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0a5c36]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setIsChangePassword(false); }}
                className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
              >
                BATAL
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-[#0a5c36] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#08482a] transition-all shadow-sm active:scale-95"
              >
                <Save size={16} /> SIMPAN PERUBAHAN
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Lengkap</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800">
                <User size={18} className="text-[#0a5c36]" /> {profile.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email / Kontak</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800">
                  <Mail size={18} className="text-[#0a5c36]" /> {profile.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username Login</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800">
                  <User size={18} className="text-[#0a5c36]" /> @{profile.username}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hak Akses Sistem</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800">
                <Shield size={18} className="text-[#0a5c36]" /> Manajemen Sirkulasi Buku, Anggota, Transaksi, & Laporan ({profile.role})
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}