import React, { useState, useEffect } from 'react';
import { PlusCircle, BookOpen, RotateCcw, CheckCircle, Search } from 'lucide-react';
import loanService from '../services/loanService';
import bookService from '../services/bookService';
import memberService from '../services/memberService';
import settingService from '../services/settingService';
import BadgeStatus from '../components/BadgeStatus';

export default function Peminjaman() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [config, setConfig] = useState({
    durasiPinjaman: 14,
    maxPeminjaman: 5,
  });
  const [successNotif, setSuccessNotif] = useState('');

  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [tanggalPinjam, setTanggalPinjam] = useState(today);
  const [tanggalKembali, setTanggalKembali] = useState('');

  const fetchData = async () => {
    try {
      const [loanRes, bookRes, memberRes, settingRes] = await Promise.all([
        loanService.getAll(),
        bookService.getAll(),
        memberService.getAll(),
        settingService.getAll().catch(() => ({ data: {} }))
      ]);

      const loanData = loanRes.data?.data || loanRes.data || [];
      const bookData = bookRes.data?.data || bookRes.data || [];
      const memberData = memberRes.data?.data || memberRes.data || [];
      const settingData = settingRes.data?.data || settingRes.data || {};

      const durasi = Number(settingData.durasiPinjaman || 14);
      const maxPinjam = Number(settingData.maxPeminjaman || 5);

      setConfig({ durasiPinjaman: durasi, maxPeminjaman: maxPinjam });

      // Hitung tanggal kembali default berdasarkan durasi pinjaman dari Pengaturan Global
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + durasi);
      setTanggalKembali(dueDateObj.toISOString().split('T')[0]);

      setLoans(Array.isArray(loanData) ? loanData : []);
      setBooks(Array.isArray(bookData) ? bookData : []);
      setMembers(Array.isArray(memberData) ? memberData : []);
    } catch (error) {
      console.error("Gagal mengambil data dari database:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMembers = members.filter(m => 
    (m.nama && m.nama.toLowerCase().includes(memberSearch.toLowerCase())) || 
    (m.id_anggota && m.id_anggota.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const filteredBooks = books.filter(b => 
    (b.judul && b.judul.toLowerCase().includes(bookSearch.toLowerCase())) || 
    (b.penulis && b.penulis.toLowerCase().includes(bookSearch.toLowerCase()))
  );

  const handleReset = () => {
    setSelectedBookId('');
    setSelectedMemberId('');
    setMemberSearch('');
    setBookSearch('');
    setTanggalPinjam(today);

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + config.durasiPinjaman);
    setTanggalKembali(dueDateObj.toISOString().split('T')[0]);
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!selectedBookId || !selectedMemberId) {
      alert("Silakan pilih Anggota dan Buku terlebih dahulu!");
      return;
    }

    // Pengecekan frontend: hitung peminjaman aktif anggota terpilih
    const activeCount = loans.filter(
      l => Number(l.member_id) === Number(selectedMemberId) && 
           (l.status?.toLowerCase() === 'dipinjam')
    ).length;

    if (activeCount >= config.maxPeminjaman) {
      alert(`Peringatan: Anggota ini sedang meminjam ${activeCount} buku. Batas maksimal peminjaman adalah ${config.maxPeminjaman} buku (Pengaturan Global).`);
      return;
    }

    try {
      await loanService.create({
        book_id: selectedBookId,
        member_id: selectedMemberId,
        tanggal_pinjam: tanggalPinjam,
        tanggal_kembali: tanggalKembali
      });

      setSuccessNotif('Peminjaman berhasil dicatat & stok buku diperbarui!');
      handleReset();
      fetchData();
      setTimeout(() => setSuccessNotif(''), 3000);
    } catch (error) {
      console.error("Gagal mencatat peminjaman:", error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat memproses peminjaman.");
    }
  };

  const handleReturnBook = async (loanId) => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin memproses pengembalian buku ini?");
    if (isConfirmed) {
      try {
        await loanService.returnBook(loanId);
        setSuccessNotif('Buku berhasil dikembalikan dan stok bertambah!');
        fetchData();
        setTimeout(() => setSuccessNotif(''), 3000);
      } catch (error) {
        console.error("Gagal mengembalikan buku:", error);
        alert(error.response?.data?.message || "Terjadi kesalahan saat pengembalian.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a5c36]">Peminjaman Buku</h1>
          <p className="text-xs text-gray-500 mt-1">Konfigurasi Aktif: Max {config.maxPeminjaman} buku / anggota | Durasi: {config.durasiPinjaman} hari</p>
        </div>
      </div>

      {successNotif && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 shadow-sm transition-all">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successNotif}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Form Catat Peminjaman */}
        <div className="col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <PlusCircle className="text-gray-800" size={24} />
            <h2 className="text-xl font-bold text-gray-800 leading-tight">Catat<br/>Peminjaman Baru</h2>
          </div>
          
          <form onSubmit={handleCreateLoan} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Cari & Pilih Anggota ({members.length} Terdaftar)
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Ketik nama / ID anggota..." 
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-[#0a5c36]"
                />
              </div>
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => {
                    const activeLoans = loans.filter(l => Number(l.member_id) === Number(m.id) && l.status?.toLowerCase() === 'dipinjam').length;
                    const isLimitReached = activeLoans >= config.maxPeminjaman;

                    return (
                      <div 
                        key={m.id} 
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`px-3 py-2 text-sm cursor-pointer transition-all duration-200 flex items-center justify-between ${
                          selectedMemberId === m.id ? 'bg-[#0a5c36] text-white font-medium' : 'text-gray-700 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{m.id_anggota} - {m.nama}</span>
                          <span className={`text-[10px] ${selectedMemberId === m.id ? 'text-green-100' : isLimitReached ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                            {activeLoans}/{config.maxPeminjaman} Buku dipinjam {isLimitReached ? '(Penuh)' : ''}
                          </span>
                        </div>
                        {selectedMemberId === m.id && <CheckCircle size={16} className="text-white opacity-80" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center italic">Anggota tidak ditemukan</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Cari & Pilih Buku ({books.length} Buku)
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Ketik judul buku..." 
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-[#0a5c36]"
                />
              </div>
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((b) => {
                    const isDisabled = b.stok < 1;
                    const isSelected = selectedBookId === b.id;
                    return (
                      <div 
                        key={b.id} 
                        onClick={() => !isDisabled && setSelectedBookId(b.id)}
                        className={`px-3 py-2 text-sm transition-all duration-200 flex justify-between items-center ${
                          isDisabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : isSelected ? 'bg-[#0a5c36] text-white font-medium cursor-pointer' : 'text-gray-700 hover:bg-green-50 cursor-pointer'
                        }`}
                      >
                        <span className="line-clamp-1 flex-1">{b.judul}</span>
                        <span className={`text-xs ml-2 whitespace-nowrap ${isSelected ? 'text-green-100' : isDisabled ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                          {isDisabled ? '(HABIS)' : `Sisa: ${b.stok}`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center italic">Buku tidak ditemukan</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Pinjam</label>
                <input 
                  type="date" 
                  value={tanggalPinjam}
                  onChange={(e) => {
                    const newPinjam = e.target.value;
                    setTanggalPinjam(newPinjam);
                    if (newPinjam) {
                      const newDueDate = new Date(newPinjam);
                      newDueDate.setDate(newDueDate.getDate() + config.durasiPinjaman);
                      setTanggalKembali(newDueDate.toISOString().split('T')[0]);
                    }
                  }}
                  required
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#0a5c36]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal Kembali (+{config.durasiPinjaman} Hari)</label>
                <input 
                  type="date" 
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  required
                  className="w-full border border-green-300 bg-green-50 rounded-lg p-2 text-xs font-bold text-[#0a5c36] focus:outline-none focus:border-[#0a5c36]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={handleReset} 
                className="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 active:bg-gray-200 active:scale-95 transition-all shadow-sm"
              >
                Reset
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2.5 bg-[#0a5c36] text-white rounded-lg text-xs font-bold hover:bg-[#08482a] active:scale-95 transition-all shadow-sm"
              >
                Konfirmasi
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Tabel Peminjaman Aktif */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="p-1.5 bg-gray-100 rounded text-gray-600 flex items-center justify-center"><BookOpen size={18} /></span> Riwayat & Peminjaman Aktif
            </h2>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wide bg-gray-50/50">
                  <th className="py-4 px-4 font-semibold">ID</th>
                  <th className="py-4 px-4 font-semibold">Anggota</th>
                  <th className="py-4 px-4 font-semibold">Judul Buku</th>
                  <th className="py-4 px-4 font-semibold">Tgl Kembali</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {loans.length > 0 ? (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-gray-500 font-mono text-xs font-medium">TRX-{loan.id}</td>
                      
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img src={`https://ui-avatars.com/api/?name=${loan.member?.nama || 'User'}&background=random`} className="w-7 h-7 rounded-full shadow-sm" alt="avatar" />
                          <span className="font-medium text-gray-800">{loan.member?.nama || 'Dihapus'}</span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-4 font-semibold text-gray-800">
                        {loan.book?.judul || 'Buku Dihapus'}
                      </td>
                      
                      <td className="py-4 px-4 text-gray-600 font-medium">
                        {loan.tanggal_kembali || loan.tanggal_jatuh_tempo}
                      </td>
                      
                      <td className="py-4 px-4">
                        <BadgeStatus status={loan.status} />
                      </td>
                      
                      <td className="py-4 px-4 text-center">
                        {loan.status === 'Dipinjam' || loan.status === 'DIPINJAM' ? (
                          <button 
                            onClick={() => handleReturnBook(loan.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm inline-flex items-center gap-2"
                            title="Kembalikan Buku"
                          >
                            <RotateCcw size={14} /> Kembali
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic font-medium">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      Belum ada data peminjaman buku.
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