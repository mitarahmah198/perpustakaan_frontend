import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Search, Filter, BookOpen, Edit3, Trash2, X, ImagePlus } from 'lucide-react';
import bookService from '../services/bookService';
import { useAuth } from '../context/AuthContext';

const Buku = () => {
  const { isSuperAdmin } = useAuth();
  const [buku, setBuku] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. STATE BARU UNTUK FILTER KATEGORI
  const [filterKategori, setFilterKategori] = useState('');
  
  const [successNotif, setSuccessNotif] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [isbn, setIsbn] = useState('');
  const [judul, setJudul] = useState('');
  const [penulis, setPenulis] = useState('');
  const [kategori, setKategori] = useState('');
  const [stok, setStok] = useState('');

  const [sampulFile, setSampulFile] = useState(null);
  const [sampulPreview, setSampulPreview] = useState('');

  const fetchBuku = async () => {
    try {
      const response = await bookService.getAll();
      const data = response.data?.data || response.data || [];
      setBuku(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil data buku:", error);
    }
  };

  useEffect(() => {
    fetchBuku();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setIsbn('');
    setJudul('');
    setPenulis('');
    setKategori('');
    setStok('');
    setSampulFile(null);
    setSampulPreview('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setIsEditing(true);
    setCurrentId(book.id);
    setIsbn(book.isbn);
    setJudul(book.judul);
    setPenulis(book.penulis);
    setKategori(book.kategori);
    setStok(book.stok);
    setSampulFile(null);
    setSampulPreview(book.sampul_url || '');
    setIsModalOpen(true);
  };

  const handleSampulChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSampulFile(file);
      setSampulPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('isbn', isbn);
    formData.append('judul', judul);
    formData.append('penulis', penulis);
    formData.append('kategori', kategori);
    formData.append('stok', Number(stok));

    if (sampulFile) {
      formData.append('sampul', sampulFile);
    }

    try {
      if (isEditing) {
        formData.append('_method', 'PUT');
        await bookService.update(currentId, formData);
        setSuccessNotif('Data buku berhasil diperbarui!');
      } else {
        await bookService.create(formData);
        setSuccessNotif('Buku baru berhasil ditambahkan ke katalog!');
      }

      fetchBuku();
      setIsModalOpen(false);
      setTimeout(() => setSuccessNotif(''), 3000);

    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data. Pastikan ISBN belum digunakan.");
    }
  };

  const handleDeleteBook = async (book) => {
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus buku "${book.judul}" dari katalog? Tindakan ini tidak dapat dibatalkan.`);
    if (isConfirmed) {
      try {
        await bookService.delete(book.id);
        setBuku(prev => prev.filter(b => b.id !== book.id));
        setSuccessNotif(`Buku "${book.judul}" berhasil dihapus.`);
        setTimeout(() => setSuccessNotif(''), 3000);
      } catch (error) {
        console.error("Gagal menghapus data:", error);
        alert("Terjadi kesalahan saat menghapus buku.");
      }
    }
  };

  // 2. LOGIKA FILTER DIPERBARUI (Pencarian + Kategori)
  const filteredBuku = buku.filter(b => {
    const cocokPencarian = 
      b.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.penulis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const cocokKategori = filterKategori === '' || b.kategori === filterKategori;
    
    return cocokPencarian && cocokKategori;
  });

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Koleksi Buku</h1>
          <p className="text-gray-500 mt-1">Kelola data inventaris buku, stok, dan katalog perpustakaan.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0a5c36] text-white rounded-xl text-xs font-bold hover:bg-[#08482a] shadow-sm transition-colors"
        >
          <Plus size={16} /> TAMBAH BUKU BARU
        </button>
      </div>

      {successNotif && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle size={20} />
          <span className="text-sm font-semibold">{successNotif}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari judul, penulis, atau ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
            />
          </div>
          
          {/* 3. DROPDOWN FILTER KATEGORI BARU */}
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
              <Filter size={16} />
            </div>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:border-[#0a5c36] appearance-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              <option value="Teknologi & Komputer">Teknologi & Komputer</option>
              <option value="Pemrograman">Pemrograman</option>
              <option value="Sains & Sains Data">Sains & Sains Data</option>
              <option value="Ekonomi & Bisnis">Ekonomi & Bisnis</option>
              <option value="Fiksi & Sastra">Fiksi & Sastra</option>
            </select>
            {/* Ikon panah bawah kustom pengganti panah bawaan browser */}
            <div className="absolute right-3 top-4 border-t-4 border-x-4 border-t-gray-400 border-x-transparent pointer-events-none"></div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wide">
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4">Judul Buku</th>
                <th className="py-3 px-4">Penulis</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50 text-gray-700">
              {filteredBuku.length > 0 ? (
                filteredBuku.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-gray-500">{book.isbn}</td>
                    <td className="py-4 px-4 font-bold text-gray-800 flex items-center gap-3">
                      {book.sampul_url ? (
                        <img
                          src={`http://localhost:8000${book.sampul_url}`}
                          alt={book.judul}
                          className="w-8 h-10 object-cover rounded shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-8 h-10 bg-emerald-50 text-[#0a5c36] rounded flex items-center justify-center shrink-0">
                          <BookOpen size={16} />
                        </div>
                      )}
                      <span>{book.judul}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{book.penulis}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">{book.kategori}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-gray-800">{book.stok} Eks</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(book)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Buku"
                        >
                          <Edit3 size={16} />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteBook(book)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Buku (Khusus Superadmin)"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400 text-sm">
                    Tidak ada data buku yang sesuai dengan pencarian atau filter Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
          {/* ... SISA KODE MODAL TETAP SAMA ... */}
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Edit Data Buku' : 'Tambah Buku Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Sampul Buku</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {sampulPreview ? (
                      <img src={sampulPreview} alt="Preview sampul" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus size={20} className="text-gray-300" />
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Pilih Gambar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSampulChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kode ISBN</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 978-602-06-3317-7"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Judul Buku</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan judul lengkap buku..."
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Penulis / Pengarang</label>
                <input
                  type="text"
                  required
                  placeholder="Nama penulis..."
                  value={penulis}
                  onChange={(e) => setPenulis(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kategori</label>
                  <select
                    required
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Teknologi & Komputer">Teknologi & Komputer</option>
                    <option value="Pemrograman">Pemrograman</option>
                    <option value="Sains & Sains Data">Sains & Sains Data</option>
                    <option value="Ekonomi & Bisnis">Ekonomi & Bisnis</option>
                    <option value="Fiksi & Sastra">Fiksi & Sastra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Jumlah Stok</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Stok..."
                    value={stok}
                    onChange={(e) => setStok(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0a5c36] text-white text-xs font-bold rounded-xl hover:bg-[#08482a] shadow-sm transition-colors"
                >
                  {isEditing ? 'SIMPAN PERUBAHAN' : 'TAMBAH BUKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Buku;