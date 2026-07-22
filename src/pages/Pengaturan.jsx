import React, { useState, useEffect } from 'react';
import { Sliders, Shield, CheckCircle } from 'lucide-react';
import settingService from '../services/settingService';
import staffService from '../services/staffService';
import BadgeStatus from '../components/BadgeStatus';

export default function Pengaturan() {
  const [config, setConfig] = useState({
    durasiPinjaman: 14,
    tarifDenda: 5000,
    maxPeminjaman: 5,
  });

  const [staffList, setStaffList] = useState([]);
  const [successNotif, setSuccessNotif] = useState('');
  const [loading, setLoading] = useState(true);

  // Ambil data konfigurasi dan staf dari backend via Services
  const fetchData = async () => {
    try {
      const [settingRes, staffRes] = await Promise.all([
        settingService.getAll(),
        staffService.getAll().catch(() => ({ data: [] }))
      ]);

      if (settingRes.data?.data) {
        setConfig(settingRes.data.data);
      }

      const staffData = staffRes.data?.data || staffRes.data || [];
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setLoading(false);
    } catch (error) {
      console.error("Gagal memuat data pengaturan:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Simpan Konfigurasi ke Database via Service
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await settingService.update(config);
      setSuccessNotif('Konfigurasi global berhasil disimpan ke database!');
      setTimeout(() => setSuccessNotif(''), 3000);
    } catch (error) {
      console.error("Gagal menyimpan konfigurasi:", error);
      alert("Terjadi kesalahan saat menyimpan konfigurasi.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Administrasi Sistem</h1>
        <p className="text-gray-500 mt-1">Kelola konfigurasi institusi global dan kredensial akses staf.</p>
      </div>

      {successNotif && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 shadow-sm transition-all">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successNotif}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Parameter Global */}
        <div className="col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
            <span className="p-1.5 bg-gray-100 rounded text-gray-600"><Sliders size={20}/></span> Parameter Global
          </h3>
          
          <form onSubmit={handleSaveConfig} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Durasi Pinjaman Dasar (Hari)</label>
                <input 
                  type="number" 
                  value={config.durasiPinjaman} 
                  onChange={(e) => setConfig({...config, durasiPinjaman: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0a5c36] text-gray-800 font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tarif Denda Per Hari (Rp)</label>
                <input 
                  type="number" 
                  value={config.tarifDenda} 
                  onChange={(e) => setConfig({...config, tarifDenda: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0a5c36] text-gray-800 font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Maksimal Peminjaman Bersamaan</label>
                <input 
                  type="number" 
                  value={config.maxPeminjaman} 
                  onChange={(e) => setConfig({...config, maxPeminjaman: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0a5c36] text-gray-800 font-medium" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6">
              <button 
                type="submit"
                className="w-full py-3 bg-[#0a5c36] text-white rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-[#08482a] active:scale-95 transition-all shadow-sm"
              >
                SIMPAN KONFIGURASI
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Direktori Staf */}
        <div className="col-span-1 xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-1.5 bg-gray-100 rounded text-gray-600"><Shield size={20}/></span> Direktori Staf ({staffList.length})
            </h3>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50/50">
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email / Pengguna</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50 text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400">Memuat data staf...</td>
                  </tr>
                ) : staffList.length > 0 ? (
                  staffList.map((staff) => {
                    const initials = staff.name ? staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';
                    const roleText = staff.role || 'Staf Perpustakaan';

                    return (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0a5c36] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {initials}
                          </div>
                          <span className="font-bold text-gray-800">{staff.name || staff.nama}</span>
                        </td>
                        <td className="py-4 px-4 text-gray-600 font-mono text-xs">{staff.email || staff.username}</td>
                        <td className="py-4 px-4 font-medium text-gray-700">{roleText}</td>
                        <td className="py-4 px-4">
                          <BadgeStatus status={staff.status || 'AKTIF'} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-gray-400">
                      Tidak ada data staf yang ditemukan di database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}