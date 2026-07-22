import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, CheckCircle, X } from 'lucide-react';
import staffService from '../services/staffService';
import BadgeStatus from '../components/BadgeStatus';

export default function ManajemenPengguna() {
  const [staffList, setStaffList] = useState([]);
  const [successNotif, setSuccessNotif] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk Modal Tambah Staf
  // Role secara default sudah di-set ke 'Staf Perpustakaan'
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Staf Perpustakaan' 
  });

  // Ambil data staf dari backend via Service
  const fetchStaff = async () => {
    try {
      const response = await staffService.getAll();
      const data = response.data?.data || response.data || [];
      setStaffList(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data staf:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Simpan Staf Baru ke Database via Service
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await staffService.create(formData);
      setSuccessNotif('Akun staf baru berhasil dibuat dan siap digunakan untuk login!');
      setShowModal(false);
      // Reset form dan pastikan role kembali ke default saat menambah lagi
      setFormData({ name: '', username: '', email: '', password: '', role: 'Staf Perpustakaan' });
      fetchStaff();
      setTimeout(() => setSuccessNotif(''), 4000);
    } catch (error) {
      console.error("Gagal menambah staf:", error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat membuat akun staf.");
    }
  };

  // Hapus Staf via Service
  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus akun staf ini?")) return;
    try {
      await staffService.delete(id);
      setSuccessNotif('Akun staf berhasil dihapus.');
      fetchStaff();
      setTimeout(() => setSuccessNotif(''), 3000);
    } catch (error) {
      console.error("Gagal menghapus staf:", error);
      alert("Gagal menghapus akun staf.");
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Header Halaman */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengguna Staf</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kredensial akses staf dan kirimkan instruksi operasional.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0a5c36] text-white rounded-xl text-xs font-bold hover:bg-[#08482a] shadow-sm transition-all active:scale-95"
        >
          <UserPlus size={16} /> TAMBAH STAF BARU
        </button>
      </div>

      {successNotif && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successNotif}</span>
        </div>
      )}

      {/* Tabel Daftar Staf */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="p-1.5 bg-gray-100 rounded text-gray-600"><Shield size={18}/></span> Daftar Akun Staf Aktif
          </h3>
          <span className="text-xs text-gray-400 font-medium">Total: {staffList.length} Akun Staf</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50/50">
                <th className="py-3 px-4">Nama</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">Memuat data staf...</td>
                </tr>
              ) : staffList.length > 0 ? (
                staffList.map((staff) => {
                  const initials = staff.name ? staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

                  return (
                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0a5c36] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{staff.name}</p>
                          <p className="text-xs text-gray-400">{staff.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-600">{staff.username}</td>
                      <td className="py-4 px-4 font-medium text-gray-700">{staff.role}</td>
                      <td className="py-4 px-4">
                        <BadgeStatus status={staff.status || 'AKTIF'} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Staf"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-gray-400">
                    Belum ada akun staf terdaftar di database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH STAF BARU */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={20} className="text-[#0a5c36]" /> Tambah Akun Staf Baru
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Username Login</label>
                  <input 
                    type="text" 
                    required
                    placeholder="budi_staf"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="budi@mail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Password Login</label>
                <input 
                  type="password" 
                  required
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0a5c36] text-white rounded-xl font-bold text-xs hover:bg-[#08482a] transition-all shadow-sm"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}