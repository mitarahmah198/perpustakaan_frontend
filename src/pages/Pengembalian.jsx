import React, { useState, useEffect } from 'react';
import { Search, User, BookOpen, ThumbsUp, Wrench, AlertCircle, CheckCircle, Printer, X } from 'lucide-react';
import loanService from '../services/loanService';
import settingService from '../services/settingService';
import BadgeStatus from '../components/BadgeStatus';

export default function Pengembalian() {
  const [loans, setLoans] = useState([]);
  const [tarifDenda, setTarifDenda] = useState(5000);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [bookCondition, setBookCondition] = useState('Baik'); // 'Baik', 'Rusak', 'Hilang'
  const [successNotif, setSuccessNotif] = useState('');

  // 1. Ambil data peminjaman aktif & tarif denda dari Backend via Service
  const fetchActiveLoans = async () => {
    try {
      const [loanRes, settingRes] = await Promise.all([
        loanService.getAll(),
        settingService.getAll().catch(() => ({ data: {} }))
      ]);

      const allLoans = loanRes.data?.data || loanRes.data || [];
      const active = allLoans.filter(loan => loan.status && loan.status.toLowerCase() === 'dipinjam');
      setLoans(active);

      const settingData = settingRes.data?.data || settingRes.data || {};
      if (settingData.tarifDenda !== undefined) {
        setTarifDenda(Number(settingData.tarifDenda));
      }
    } catch (error) {
      console.error("Gagal mengambil data peminjaman:", error);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  // 2. Filter pencarian berdasarkan input
  const filteredLoans = loans.filter(trx => {
    const query = searchQuery.toLowerCase();
    const idTrx = `trx-${trx.id}`.toLowerCase();
    const nama = trx.member?.nama?.toLowerCase() || '';
    const judul = trx.book?.judul?.toLowerCase() || '';
    return idTrx.includes(query) || nama.includes(query) || judul.includes(query);
  });

  // Hitung keterlambatan & denda secara dinamis berdasarkan tarif denda global
  const calculateFine = (tanggalKembaliStr) => {
    if (!tanggalKembaliStr) return { teksKeterlambatan: 'Tepat Waktu', dendaKeterlambatan: 0 };
    
    const jatuhTempo = new Date(tanggalKembaliStr);
    const hariIni = new Date();
    
    jatuhTempo.setHours(0,0,0,0);
    hariIni.setHours(0,0,0,0);

    const selisihHari = Math.floor((hariIni - jatuhTempo) / (1000 * 60 * 60 * 24));
    
    if (selisihHari > 0) {
      const dendaKeterlambatan = selisihHari * tarifDenda; // Menggunakan tarif denda dinamis dari Pengaturan Global
      return {
        teksKeterlambatan: `Terlambat ${selisihHari} Hari`,
        dendaKeterlambatan: dendaKeterlambatan
      };
    }
    return {
      teksKeterlambatan: 'Tepat Waktu',
      dendaKeterlambatan: 0
    };
  };

  // Kalkulasi total rincian denda
  const getFineDetails = (tanggalJatuhTempo) => {
    const { teksKeterlambatan, dendaKeterlambatan } = calculateFine(tanggalJatuhTempo);
    
    let dendaKerusakan = 0;
    if (bookCondition === 'Rusak') dendaKerusakan = 25000;
    if (bookCondition === 'Hilang') dendaKerusakan = 100000;

    return {
      keterlambatan: teksKeterlambatan,
      dendaKeterlambatan,
      dendaKerusakan,
      totalDenda: dendaKeterlambatan + dendaKerusakan
    };
  };

  const handleRowClick = (trx) => {
    if (selectedTransaction?.id === trx.id) {
      setSelectedTransaction(null);
    } else {
      setSelectedTransaction(trx);
      setBookCondition('Baik');
    }
  };

  // 3. Eksekusi Pengembalian ke Database (POST VIA SERVICE)
  const handleCompleteReturn = async () => {
    if (!selectedTransaction) return;

    const fineDetails = getFineDetails(selectedTransaction.tanggal_kembali || selectedTransaction.tanggal_jatuh_tempo);

    try {
      await loanService.returnBook(selectedTransaction.id, {
        kondisi_buku: bookCondition,
        denda_keterlambatan: fineDetails.dendaKeterlambatan,
        denda_kerusakan: fineDetails.dendaKerusakan
      });

      setSuccessNotif(`Transaksi TRX-${selectedTransaction.id} berhasil diselesaikan! Stok buku bertambah.`);
      setSelectedTransaction(null); 
      fetchActiveLoans();
      
      setTimeout(() => setSuccessNotif(''), 4000);
    } catch (error) {
      console.error("Gagal memproses pengembalian:", error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat memproses pengembalian.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a5c36]">Pengembalian Buku</h1>
          <p className="text-xs text-gray-500 mt-1">Tarif denda aktif: Rp {tarifDenda.toLocaleString('id-ID')} / hari (Mengikuti Pengaturan Global)</p>
        </div>
      </div>

      {successNotif && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successNotif}</span>
        </div>
      )}

      {/* Kotak Pencarian */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <label className="block text-lg font-semibold text-gray-800 mb-3">Cari Transaksi Peminjaman</label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Masukkan ID Peminjaman, Nama Anggota, atau Judul Buku..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0a5c36]" 
            />
          </div>
          <button className="px-8 bg-[#0a5c36] text-white rounded-lg font-bold hover:bg-[#08482a] transition-all">CARI</button>
        </div>
      </div>

      {/* Layout Dinamis */}
      <div className={`grid gap-6 transition-all duration-300 ${selectedTransaction ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1'}`}>
        
        {/* Kolom Tabel Daftar Peminjam */}
        <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col transition-all ${selectedTransaction ? 'xl:col-span-2' : 'col-span-1'}`}>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Daftar Peminjam Aktif ({filteredLoans.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-gray-200 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="py-3 font-medium">ID TRX</th>
                  <th className="py-3 font-medium">Nama Anggota</th>
                  <th className="py-3 font-medium">Judul Buku</th>
                  <th className="py-3 font-medium">Jatuh Tempo</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50 text-gray-700">
                {filteredLoans.length > 0 ? (
                  filteredLoans.map((trx) => {
                    const statusInfo = calculateFine(trx.tanggal_kembali || trx.tanggal_jatuh_tempo);
                    const isLate = statusInfo.teksKeterlambatan.includes('Terlambat');
                    
                    return (
                      <tr 
                        key={trx.id}
                        onClick={() => handleRowClick(trx)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedTransaction?.id === trx.id ? 'bg-green-50/70 border-l-4 border-l-[#0a5c36]' : ''}`}
                      >
                        <td className="py-4 font-mono text-gray-500 font-semibold">TRX-{trx.id}</td>
                        <td className="py-4 font-medium text-gray-800">{trx.member?.nama || 'Anggota Dihapus'}</td>
                        <td className="py-4 truncate max-w-xs">{trx.book?.judul || 'Buku Dihapus'}</td>
                        <td className="py-4 text-gray-600">{trx.tanggal_kembali || trx.tanggal_jatuh_tempo}</td>
                        <td className="py-4">
                          <BadgeStatus status={statusInfo.teksKeterlambatan} type={isLate ? 'danger' : 'success'} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">
                      Tidak ada transaksi peminjaman aktif yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Denda & Detail Kondisi Buku */}
        {selectedTransaction && (() => {
          const fineDetails = getFineDetails(selectedTransaction.tanggal_kembali || selectedTransaction.tanggal_jatuh_tempo);
          
          return (
            <div className="col-span-1 space-y-6 animate-fadeIn">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full text-gray-600 transition-colors"
                  title="Tutup Rincian"
                >
                  <X size={16} />
                </button>
                
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <User size={18} className="text-gray-500"/> Detail Anggota
                </h3>
                <div className="text-sm space-y-2 mb-6 pb-4 border-b border-gray-100">
                  <p><span className="text-gray-400 text-xs block">Nama & ID</span> <strong className="text-gray-800">{selectedTransaction.member?.nama} ({selectedTransaction.member?.id_anggota})</strong></p>
                  <p><span className="text-gray-400 text-xs block">Kontak / Email</span> {selectedTransaction.member?.email || '-'}</p>
                </div>

                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-gray-500"/> Kondisi Buku
                </h3>
                <div className="space-y-3 mb-2">
                  <p className="text-sm font-medium text-gray-800">{selectedTransaction.book?.judul}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={() => setBookCondition('Baik')}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${bookCondition === 'Baik' ? 'bg-green-50 border-2 border-green-500 text-green-700 font-bold' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      <ThumbsUp size={16} /> <span>Baik</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setBookCondition('Rusak')}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${bookCondition === 'Rusak' ? 'bg-orange-50 border-2 border-orange-500 text-orange-700 font-bold' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      <Wrench size={16} /> <span>Rusak</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setBookCondition('Hilang')}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${bookCondition === 'Hilang' ? 'bg-red-50 border-2 border-red-500 text-red-700 font-bold' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      <AlertCircle size={16} /> <span>Hilang</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-orange-200 pb-3">
                  <AlertCircle size={18} className="text-orange-600"/> Rincian Denda
                </h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Keterlambatan ({fineDetails.keterlambatan})</span>
                    <span>Rp {fineDetails.dendaKeterlambatan.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Kondisi Buku ({bookCondition})</span>
                    <span>Rp {fineDetails.dendaKerusakan.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end mb-6">
                  <span className="text-base font-bold text-gray-800">Total Denda</span>
                  <span className="text-2xl font-black text-[#966418]">Rp {fineDetails.totalDenda.toLocaleString('id-ID')}</span>
                </div>
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={handleCompleteReturn}
                    className="w-full py-3 bg-[#0a5c36] text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-[#08482a] active:scale-95 transition-all shadow-sm"
                  >
                    <CheckCircle size={18}/> SELESAIKAN PENGEMBALIAN
                  </button>
                  
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}