import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Users, ArrowRightLeft, Book as BookIcon, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import memberService from '../services/memberService';
import loanService from '../services/loanService';
import BadgeStatus from '../components/BadgeStatus';

// Ambil tanggal peminjaman dari record loan (fallback ke created_at jika tanggal_pinjam kosong)
function getLoanDate(loan) {
  const raw = loan.tanggal_pinjam || loan.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d;
}

// Bangun data chart (label + jumlah + persen tinggi bar) berdasarkan periode yang dipilih
function generateChartData(loans, periode) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let buckets = [];

  if (periode === 'minggu') {
    // 7 hari terakhir, per hari
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({ label: dayNames[d.getDay()], date: d.getTime(), count: 0 });
    }
    loans.forEach((l) => {
      const tgl = getLoanDate(l);
      if (!tgl) return;
      tgl.setHours(0, 0, 0, 0);
      const b = buckets.find((b) => b.date === tgl.getTime());
      if (b) b.count++;
    });
  } else if (periode === 'bulan') {
    // 30 hari terakhir, dikelompokkan per minggu (4 bucket)
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      buckets.push({ label: `Minggu ${4 - i}`, start: start.getTime(), end: end.getTime(), count: 0 });
    }
    loans.forEach((l) => {
      const tgl = getLoanDate(l);
      if (!tgl) return;
      tgl.setHours(0, 0, 0, 0);
      const t = tgl.getTime();
      const b = buckets.find((b) => t >= b.start && t <= b.end);
      if (b) b.count++;
    });
  } else {
    // 12 bulan terakhir
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), count: 0 });
    }
    loans.forEach((l) => {
      const tgl = getLoanDate(l);
      if (!tgl) return;
      const b = buckets.find((b) => b.year === tgl.getFullYear() && b.month === tgl.getMonth());
      if (b) b.count++;
    });
  }

  const maxVal = Math.max(...buckets.map((b) => b.count), 1);
  return buckets.map((b) => ({
    label: b.label,
    jumlah: b.count,
    persen: b.count === 0 ? 4 : Math.max(Math.round((b.count / maxVal) * 100), 8),
  }));
}

const PERIODE_LABEL = {
  minggu: '7 Hari Terakhir',
  bulan: '30 Hari Terakhir (per Minggu)',
  tahun: '12 Bulan Terakhir',
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBuku: 0,
    totalAnggota: 0,
    transaksiHariIni: 0,
    bukuTerlambatCount: 0,
  });

  const [dueSoonList, setDueSoonList] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [periode, setPeriode] = useState('minggu'); // 'minggu' | 'bulan' | 'tahun'
  const [loading, setLoading] = useState(true);

  // Ambil data real-time dari backend via Service Layer
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookRes, memberRes, loanRes] = await Promise.all([
          bookService.getAll(),
          memberService.getAll(),
          loanService.getAll(),
        ]);

        const books = bookRes.data?.data || bookRes.data || [];
        const members = memberRes.data?.data || memberRes.data || [];
        const loans = loanRes.data?.data || loanRes.data || [];

        setAllLoans(loans);

        // Hitung transaksi hari ini
        const todayStr = new Date().toISOString().split('T')[0];
        const transaksiHariIni = loans.filter((l) => {
          const tglPinjam = l.tanggal_pinjam || (l.created_at ? l.created_at.split('T')[0] : '');
          return tglPinjam === todayStr;
        }).length;

        // Filter peminjaman yang telat / jatuh tempo
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let terlambatCount = 0;
        const processedDueSoon = [];

        loans.forEach((loan) => {
          const isDipinjam = loan.status && loan.status.toLowerCase() === 'dipinjam';
          if (!isDipinjam) return;

          const tglJatuhTempoStr = loan.tanggal_kembali || loan.tanggal_jatuh_tempo;
          if (!tglJatuhTempoStr) return;

          const jatuhTempo = new Date(tglJatuhTempoStr);
          jatuhTempo.setHours(0, 0, 0, 0);

          const selisihHari = Math.floor((today - jatuhTempo) / (1000 * 60 * 60 * 24));

          if (selisihHari > 0) {
            terlambatCount++;
            if (processedDueSoon.length < 3) {
              processedDueSoon.push({
                id: loan.id,
                judul: loan.book?.judul || 'Buku Dihapus',
                peminjam: loan.member?.nama || 'Anggota Dihapus',
                sampul_url: loan.book?.sampul_url,
                status: 'TERLAMBAT',
                info: `-${selisihHari} Hari`,
                tipe: 'danger',
              });
            }
          } else if (selisihHari === 0) {
            if (processedDueSoon.length < 3) {
              processedDueSoon.push({
                id: loan.id,
                judul: loan.book?.judul || 'Buku Dihapus',
                peminjam: loan.member?.nama || 'Anggota Dihapus',
                sampul_url: loan.book?.sampul_url,
                status: 'HARI INI',
                info: 'Jatuh Tempo',
                tipe: 'warning',
              });
            }
          }
        });

        setStats({
          totalBuku: books.length.toLocaleString('id-ID'),
          totalAnggota: members.length.toLocaleString('id-ID'),
          transaksiHariIni: transaksiHariIni,
          bukuTerlambatCount: terlambatCount,
        });

        setDueSoonList(processedDueSoon);
        setLoading(false);
      } catch (error) {
        console.error('Gagal memuat data dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Data chart dihitung ulang setiap kali data pinjaman atau periode berubah
  const chartData = useMemo(() => generateChartData(allLoans, periode), [allLoans, periode]);
  const totalTransaksiPeriode = useMemo(() => chartData.reduce((sum, d) => sum + d.jumlah, 0), [chartData]);

  return (
    <div className="space-y-6">
      
      {/* 3 Cards Statistik Utama */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Card 1: Total Buku */}
        <Link to="/buku" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#0a5c36] hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-gray-100 text-[#0a5c36] rounded-lg flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Database</span>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Buku</p>
            <h3 className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.totalBuku}</h3>
          </div>
        </Link>

        {/* Card 2: Total Anggota */}
        <Link to="/anggota" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#0a5c36] hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-gray-100 text-[#0a5c36] rounded-lg flex items-center justify-center">
              <Users size={24} />
            </div>
            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Database</span>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Anggota</p>
            <h3 className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.totalAnggota}</h3>
          </div>
        </Link>

        {/* Card 3: Transaksi Hari Ini */}
        <Link to="/peminjaman" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft size={24} />
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">Hari Ini</span>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Transaksi Hari Ini</p>
            <h3 className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.transaksiHariIni}</h3>
          </div>
        </Link>

      </div>

      {/* Main Grid: Chart & Peminjaman Jatuh Tempo / Terlambat */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Chart Tren Peminjaman (Real Data) */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-green-50 text-[#0a5c36] rounded-lg"><TrendingUp size={18} /></span>
              <h3 className="text-lg font-bold text-gray-800">Tren Peminjaman</h3>
            </div>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="text-sm border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg text-gray-600 outline-none cursor-pointer"
            >
              <option value="minggu">Minggu Ini (7 Hari)</option>
              <option value="bulan">Bulan Ini (30 Hari)</option>
              <option value="tahun">Tahun Ini (12 Bulan)</option>
            </select>
          </div>

          {loading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Memuat data...</div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-4 px-6 pt-8 pb-2 border-b border-gray-200 relative">
              <div className="absolute inset-x-0 top-0 border-b border-gray-100 h-1/4"></div>
              <div className="absolute inset-x-0 top-1/4 border-b border-gray-100 h-1/4"></div>
              <div className="absolute inset-x-0 top-2/4 border-b border-gray-100 h-1/4"></div>

              {chartData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative z-10">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded font-mono shadow-md whitespace-nowrap">
                    {data.jumlah} Transaksi
                  </div>
                  <div
                    style={{ height: `${data.persen}%` }}
                    className="w-full max-w-[40px] bg-[#0a5c36]/80 group-hover:bg-[#0a5c36] rounded-t-lg transition-all duration-300"
                  ></div>
                  <span className="text-xs font-semibold text-gray-500 mt-1">{data.label}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
            <span>{PERIODE_LABEL[periode]} &middot; {totalTransaksiPeriode} total transaksi</span>
            <span className="font-semibold text-gray-600">Total Anggota: {stats.totalAnggota}</span>
          </div>
        </div>

        {/* Kolom Kanan: Peminjaman Jatuh Tempo & Terlambat */}
        <div className="col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 leading-tight">Peminjaman<br/>Jatuh Tempo</h3>
                <p className="text-xs text-red-600 font-medium mt-1">{stats.bukuTerlambatCount} Buku Telat Dikembalikan</p>
              </div>
              <Link to="/pengembalian" className="text-sm text-gray-500 hover:text-[#0a5c36] font-medium">Lihat Semua</Link>
            </div>
            
            <div className="space-y-4">
              {dueSoonList.length > 0 ? (
                dueSoonList.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.sampul_url ? (
                      <img
                        // Menggunakan trik yang sama dengan halaman Buku untuk memanggil URL localhost:8000
                        src={`http://localhost:8000${item.sampul_url}`} 
                        alt={item.judul}
                        className="w-12 h-16 object-cover rounded shrink-0 border border-gray-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded shrink-0 flex items-center justify-center bg-red-50 text-red-500">
                        <BookIcon size={24} />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-bold text-gray-800 truncate">{item.judul}</h4>
                      <p className="text-xs text-gray-500 truncate">{item.peminjam}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <BadgeStatus status={item.status} type={item.tipe} />
                      <p className={`text-xs mt-1 font-semibold ${item.status === 'TERLAMBAT' ? 'text-red-600' : 'text-gray-500'}`}>{item.info}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
                  <CheckCircle size={32} className="text-green-500 mb-2 opacity-60" />
                  <p className="text-xs">Tidak ada peminjaman yang terlambat saat ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
