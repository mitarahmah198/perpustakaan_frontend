import React, { useState, useEffect } from 'react';
import { Download, Filter, TrendingUp, CheckCircle2, AlertOctagon } from 'lucide-react';
import * as XLSX from 'xlsx';
import laporanService from '../services/laporanService';
import BadgeStatus from '../components/BadgeStatus';

export default function Laporan() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Filter aktif
  const [periode, setPeriode] = useState('Semua');

  // Ambil data peminjaman dari backend via Service
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await laporanService.getReportData();
      const data = response.data?.data || response.data || [];
      setLoans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal memuat data laporan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Logika Filter Berdasarkan Periode Waktu
  const displayedLoans = loans.filter(loan => {
    const tglPinjamStr = loan.tanggal_pinjam || loan.created_at;
    if (!tglPinjamStr) return true;

    const tglPinjam = new Date(tglPinjamStr);
    const sekarang = new Date();

    if (periode === 'Mingguan') {
      const satuMingguLalu = new Date();
      satuMingguLalu.setDate(sekarang.getDate() - 7);
      return tglPinjam >= satuMingguLalu && tglPinjam <= sekarang;
    }

    if (periode === 'Bulanan (Bulan Ini)') {
      return (
        tglPinjam.getMonth() === sekarang.getMonth() &&
        tglPinjam.getFullYear() === sekarang.getFullYear()
      );
    }

    if (periode === 'Tahunan') {
      return tglPinjam.getFullYear() === sekarang.getFullYear();
    }

    return true; // 'Semua'
  });

  // Hitung Statistik Otomatis dari Data yang Telah Difilter
  const totalPeminjaman = displayedLoans.length;

  const dikembalikanTepatWaktu = displayedLoans.filter(l => {
    if (l.status?.toUpperCase() !== 'DIKEMBALIKAN' && l.status !== 'Dikembalikan') return false;
    const tglJatuhTempo = new Date(l.tanggal_kembali || l.tanggal_jatuh_tempo);
    return new Date(l.updated_at) <= tglJatuhTempo;
  }).length;

  const persentaseTepatWaktu = totalPeminjaman > 0 ? Math.round((dikembalikanTepatWaktu / totalPeminjaman) * 100) : 100;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const keterlambatanCount = displayedLoans.filter(l => {
    const isDipinjam = l.status?.toUpperCase() === 'DIPINJAM' || l.status === 'Dipinjam';
    const tglJatuhTempo = new Date(l.tanggal_kembali || l.tanggal_jatuh_tempo);
    tglJatuhTempo.setHours(0, 0, 0, 0);
    return isDipinjam && tglJatuhTempo < today;
  }).length;

  // Ekspor data yang tampil ke file Excel (.xlsx)
  const handleExportExcel = () => {
    if (displayedLoans.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const rows = displayedLoans.map(loan => ({
      'ID Transaksi': `TRX-${loan.id}`,
      'Judul Buku': loan.book?.judul || 'Buku Dihapus',
      'Anggota': loan.member?.nama || 'Anggota Dihapus',
      'Tgl Pinjam': loan.tanggal_pinjam || '-',
      'Tenggat Waktu': loan.tanggal_kembali || loan.tanggal_jatuh_tempo || '-',
      'Status': loan.status || 'Dipinjam',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

    const tanggalFile = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Laporan-Peminjaman-${periode}-${tanggalFile}.xlsx`);
  };

  return (
    <div className="space-y-6">

      {/* Header Halaman & Tombol Ekspor */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Data Laporan</h1>
          <p className="text-gray-500 mt-1">Ringkasan statistik dan aktivitas perpustakaan dari database.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
          >
            <Download size={16} /> EKSPOR EXCEL
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Periode Waktu</label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#0a5c36]"
          >
            <option>Semua</option>
            <option>Bulanan (Bulan Ini)</option>
            <option>Mingguan</option>
            <option>Tahunan</option>
          </select>
        </div>
      </div>

      {/* 3 Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Peminjaman ({periode})</p>
          <div className="flex justify-between items-end mt-4">
            <h3 className="text-4xl font-extrabold text-gray-800">{loading ? '...' : totalPeminjaman}</h3>
            <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
              <TrendingUp size={14} /> Terfilter
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pengembalian Tepat Waktu</p>
          <div className="flex justify-between items-end mt-4">
            <h3 className="text-4xl font-extrabold text-gray-800">{loading ? '...' : `${persentaseTepatWaktu}%`}</h3>
            <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Stabil
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between bg-red-50/20">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Keterlambatan (Lewat Tenggat)</p>
          <div className="flex justify-between items-end mt-4">
            <h3 className="text-4xl font-extrabold text-red-600">{loading ? '...' : keterlambatanCount}</h3>
            <span className="bg-red-100 text-red-600 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
              <AlertOctagon size={14} /> Perlu Tindakan
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Pratinjau Data */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 text-base">Pratinjau Data: Aktivitas Peminjaman ({periode})</h3>
          <span className="text-xs text-gray-400 font-medium">Menampilkan {displayedLoans.length} data</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-y border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-4">ID Transaksi</th>
                <th className="py-3 px-4">Judul Buku</th>
                <th className="py-3 px-4">Anggota</th>
                <th className="py-3 px-4">Tgl Pinjam</th>
                <th className="py-3 px-4">Tenggat Waktu</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50 text-gray-700">
              {displayedLoans.length > 0 ? (
                displayedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono text-gray-500 text-xs font-semibold">TRX-{loan.id}</td>
                    <td className="py-4 px-4 font-medium text-gray-800">{loan.book?.judul || 'Buku Dihapus'}</td>
                    <td className="py-4 px-4 text-gray-600">{loan.member?.nama || 'Anggota Dihapus'}</td>
                    <td className="py-4 px-4 text-gray-600">{loan.tanggal_pinjam || '-'}</td>
                    <td className="py-4 px-4 text-gray-600">{loan.tanggal_kembali || loan.tanggal_jatuh_tempo || '-'}</td>
                    <td className="py-4 px-4">
                      <BadgeStatus status={loan.status || 'Dipinjam'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    Tidak ada data transaksi yang cocok dengan filter periode tersebut.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}