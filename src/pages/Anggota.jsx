import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, CheckCircle, X, Edit3, Trash2 } from 'lucide-react';
import memberService from '../services/memberService';
import BadgeStatus from '../components/BadgeStatus';

export default function Anggota() {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [successNotif, setSuccessNotif] = useState('');

  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Field Form
  const [idAnggota, setIdAnggota] = useState('');
  const [nama, setNama] = useState('');
  const [fakultas, setFakultas] = useState('');
  const [kontak, setKontak] = useState('');
  const [status, setStatus] = useState('Aktif');

  // 1. FUNGSI AMBIL DATA ANGGOTA
  const fetchMembers = async () => {
    try {
      const response = await memberService.getAll();
      const data = response.data?.data || response.data || [];
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil data anggota:", error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Buka Modal Tambah
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setIdAnggota(`SA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setNama('');
    setFakultas('');
    setKontak('');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEditModal = () => {
    if (!selectedMember) return;
    setIsEditing(true);
    setCurrentId(selectedMember.id); // ID database
    setIdAnggota(selectedMember.id_anggota);
    setNama(selectedMember.nama);
    setFakultas(selectedMember.fakultas);
    setKontak(selectedMember.kontak);
    setStatus(selectedMember.status);
    setIsModalOpen(true);
  };

  // 2. FUNGSI SIMPAN & UPDATE ANGGOTA
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const payload = {
      id_anggota: idAnggota,
      nama,
      fakultas,
      kontak,
      status
    };

    try {
      if (isEditing) {
        await memberService.update(currentId, payload);
        setSuccessNotif('Data anggota berhasil diperbarui!');
        // Update tampilan sidebar dengan data terbaru
        setSelectedMember({ ...selectedMember, ...payload }); 
      } else {
        await memberService.create(payload);
        setSuccessNotif('Anggota baru berhasil ditambahkan!');
      }
      
      fetchMembers();
      setIsModalOpen(false);
      setTimeout(() => setSuccessNotif(''), 3000);
    } catch (error) {
      console.error("Detail Error:", error.response?.data);
      alert("Gagal: " + (error.response?.data?.message || "Terjadi kesalahan pada server"));
    }
  };

  // 3. FUNGSI HAPUS ANGGOTA
  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus data anggota "${selectedMember.nama}"? Tindakan ini tidak bisa dibatalkan.`);
    if (isConfirmed) {
      try {
        await memberService.delete(selectedMember.id);
        setSuccessNotif(`Data anggota "${selectedMember.nama}" berhasil dihapus.`);
        setSelectedMember(null); 
        fetchMembers();
        setTimeout(() => setSuccessNotif(''), 3000);
      } catch (error) {
        console.error("Gagal menghapus:", error);
        // UBAH BARIS ALERT INI:
        const errorMessage = error.response?.data?.message || "Terjadi kesalahan saat menghapus data anggota.";
        alert(`Gagal Hapus: ${errorMessage}`);
      }
    }
  };

  const handleRowClick = (member) => {
    if (selectedMember?.id === member.id) {
      setSelectedMember(null);
    } else {
      setSelectedMember(member);
    }
  };

  const filteredMembers = members.filter(m => 
    m.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id_anggota?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.fakultas?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-[#0a5c36]">Manajemen Anggota</h1>
      </div>

      {/* Notifikasi Berhasil */}
      {successNotif && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successNotif}</span>
        </div>
      )}

      <div className={`grid gap-6 transition-all duration-300 ${selectedMember ? 'grid-cols-3' : 'grid-cols-1'}`}>
        
        {/* Kolom Tabel Anggota */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col transition-all ${selectedMember ? 'col-span-2' : 'col-span-1'}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama, nomor anggota..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none" 
              />
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a5c36] text-white rounded-lg text-sm font-medium hover:bg-[#08482a]"
            >
              <Plus size={16} /> Tambah Anggota
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Daftar Anggota</h3>
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><Filter size={14} /> Filter</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-gray-200 text-xs text-gray-400 uppercase">
                  <th className="py-3 font-medium">Nomor Anggota</th>
                  <th className="py-3 font-medium">Nama</th>
                  <th className="py-3 font-medium">Kontak</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <tr 
                      key={member.id} 
                      onClick={() => handleRowClick(member)}
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${selectedMember?.id === member.id ? 'bg-green-50/70 border-l-4 border-l-[#0a5c36]' : ''}`}
                    >
                      <td className="py-4 text-gray-600 font-medium">{member.id_anggota}</td>
                      <td className="py-4 flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${member.nama}`} className="w-8 h-8 rounded-full" alt="avatar" />
                        <div>
                          <p className={`font-bold ${selectedMember?.id === member.id ? 'text-[#0a5c36]' : 'text-gray-800'}`}>{member.nama}</p>
                          <p className="text-xs text-gray-500">{member.fakultas}</p>
                        </div>
                      </td>
                      <td className="py-4 text-gray-600">{member.kontak}</td>
                      <td className="py-4">
                        <BadgeStatus status={member.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      Belum ada data anggota. Silakan tambah anggota baru.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Detail Profil Anggota */}
        {selectedMember && (
          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative flex flex-col">
              <div className="h-24 bg-teal-50 shrink-0"></div>
              
              <button 
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white p-1.5 rounded-full text-gray-600 hover:text-red-600 shadow-sm transition-colors"
                title="Tutup Profil"
              >
                <X size={18} />
              </button>

              <div className="px-6 pb-6 text-center -mt-12 flex-1">
                <img src={`https://ui-avatars.com/api/?name=${selectedMember.nama}`} className="w-24 h-24 rounded-full border-4 border-white mx-auto shadow-sm bg-white" alt="Profile" />
                <h2 className="text-xl font-bold text-gray-800 mt-2">{selectedMember.nama}</h2>
                <p className="text-sm text-gray-500">{selectedMember.id_anggota}</p>
                
                <div className="flex justify-center gap-2 mt-3">
                  <BadgeStatus status={selectedMember.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left mt-6 pt-6 border-t border-gray-100 text-sm">
                  <div><p className="text-xs text-gray-400 mb-1">Telepon / Kontak</p><p className="font-medium text-gray-700">{selectedMember.kontak}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Fakultas</p><p className="font-medium text-gray-700">{selectedMember.fakultas}</p></div>
                </div>

                {/* Tombol Aksi Tambahan */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button 
                    onClick={handleOpenEditModal}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Edit3 size={16} /> EDIT
                  </button>
                  <button 
                    onClick={handleDeleteMember}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 size={16} /> HAPUS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal Popup Tambah/Edit Anggota */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl relative animate-fadeIn">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {isEditing ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nomor Anggota</label>
                <input 
                  type="text" 
                  required
                  value={idAnggota}
                  onChange={(e) => setIdAnggota(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  readOnly={isEditing} // Jika sedang edit, biasanya ID Anggota tidak boleh diubah
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap..." 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fakultas / Program Studi</label>
                <input 
                  type="text" 
                  required
                  value={fakultas}
                  onChange={(e) => setFakultas(e.target.value)}
                  placeholder="mis. Fakultas Teknik / Fakultas Ilmu Komputer" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kontak / No. Telepon</label>
                <input 
                  type="text" 
                  required
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                  placeholder="mis. 081234567890" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status Keanggotaan</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-[#0a5c36] text-white rounded-xl text-sm font-bold">
                  {isEditing ? 'Simpan Perubahan' : 'Simpan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}