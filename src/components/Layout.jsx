import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Book, Users, ArrowUpRight, ArrowDownLeft, 
  FileText, Settings, UserCog, Search, Bell, ShieldCheck, AlertTriangle, Send, X, Check, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const [notifForm, setNotifForm] = useState({
    title: '',
    description: '',
    type: 'warning',
  });

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll().catch(() => ({ data: [] }));
      const notifData = response.data?.data || response.data || [];
      setNotifications(Array.isArray(notifData) ? notifData : []);
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Gagal menandai notifikasi:", error);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await notificationService.send(notifForm);
      setSuccessMsg('Peringatan berhasil dikirim ke seluruh staf!');
      setNotifForm({ title: '', description: '', type: 'warning' });
      setShowSendModal(false);
      fetchNotifications();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Gagal mengirim notifikasi:", error);
      alert("Terjadi kesalahan saat mengirim peringatan.");
    }
  };

  const handleLogoutClick = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) {
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/', label: 'Dasbor', icon: <LayoutDashboard size={20} /> },
    { path: '/buku', label: 'Buku', icon: <Book size={20} /> },
    { path: '/anggota', label: 'Anggota', icon: <Users size={20} /> },
    { path: '/peminjaman', label: 'Peminjaman', icon: <ArrowUpRight size={20} /> },
    { path: '/pengembalian', label: 'Pengembalian', icon: <ArrowDownLeft size={20} /> },
    { path: '/laporan', label: 'Laporan', icon: <FileText size={20} /> },
  ];

  const adminMenu = [
    { path: '/pengaturan', label: 'Pengaturan', icon: <Settings size={20} /> },
    { path: '/pengguna', label: 'Manajemen Pengguna', icon: <UserCog size={20} /> },
  ];

  const allMenus = [...menuItems, ...adminMenu, { path: '/profil', label: 'Profil Pengguna' }];

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0a5c36&color=fff`;

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a5c36] text-white flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3">
            <img src="/logo.png" alt="SIPUS Logo" className="w-10 h-10 object-contain bg-white rounded p-1" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">SIPUS</h1>
              <p className="text-[10px] text-gray-300 leading-tight">Sistem Informasi<br/>Perpustakaan</p>
            </div>
          </div>
          
          <nav className="px-4 py-2 space-y-1 overflow-y-auto">
            <p className="px-4 text-[10px] uppercase font-bold text-gray-300 tracking-wider mb-2">Menu Utama</p>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  location.pathname === item.path ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            {/* Navigasi Khusus Super Admin (Hanya tampil jika user role adalah superadmin) */}
            {isSuperAdmin && (
              <div className="pt-4 mt-4 border-t border-emerald-800">
                <p className="px-4 text-[10px] uppercase font-bold text-amber-300 tracking-wider mb-2 flex items-center gap-1">
                  <ShieldCheck size={12} /> Khusus Super Admin
                </p>
                {adminMenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                      location.pathname === item.path ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Informasi Akun Aktif & Logout */}
        <div className="p-4 bg-emerald-950/40 m-4 rounded-xl border border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-amber-300 uppercase tracking-wide font-medium truncate">{user?.role || 'staf'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogoutClick} 
            className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            title="Keluar / Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center relative">
          <h2 className="text-2xl font-bold text-gray-800">
            {allMenus.find(m => m.path === location.pathname)?.label || 'Dasbor'}
          </h2>
          
          <div className="flex items-center gap-6">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari katalog, anggota..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm w-64 focus:outline-none focus:border-[#0a5c36]"
              />
            </div>

            {/* Tombol Lonceng Notifikasi */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-500 hover:text-gray-700 relative p-1 transition-colors"
                title="Peringatan & Notifikasi"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-88 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-fadeIn">
                  <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Pusat Peringatan & Notifikasi</h3>
                      <span className="text-[10px] text-gray-400">Terhubung Real-time Backend</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div className="px-4 py-2 border-b border-gray-100 bg-amber-50/50 flex justify-between items-center">
                      <span className="text-xs font-semibold text-amber-800">Mode Superadmin</span>
                      <button 
                        onClick={() => { setShowNotifications(false); setShowSendModal(true); }}
                        className="flex items-center gap-1 text-xs font-bold bg-[#0a5c36] text-white px-2.5 py-1 rounded-lg hover:bg-[#08482a]"
                      >
                        <Send size={12} /> Kirim Peringatan
                      </button>
                    </div>
                  )}

                  <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-3.5 hover:bg-gray-50 flex gap-3 items-start cursor-pointer transition-colors ${!notif.is_read ? 'bg-emerald-50/30' : ''}`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            notif.type === 'danger' ? 'bg-red-100 text-red-600' : 
                            notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-sky-600'
                          }`}>
                            <AlertTriangle size={16} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className={`text-xs font-bold ${!notif.is_read ? 'text-gray-900 font-extrabold' : 'text-gray-700'}`}>{notif.title}</p>
                              {!notif.is_read && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1"></span>}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 leading-snug">{notif.description}</p>
                            <span className="text-[10px] text-gray-400 mt-1.5 block">
                              {notif.created_at ? new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-gray-400">
                        Belum ada notifikasi atau peringatan.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Tombol Profil */}
            <Link 
              to="/profil" 
              className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all shrink-0 ${location.pathname === '/profil' ? 'border-[#0a5c36] shadow-md' : 'border-gray-300 hover:border-[#0a5c36]'}`}
              title="Profil Pengguna"
            >
               <img src={avatarUrl} alt="Profile" />
            </Link>
          </div>
        </header>

        {successMsg && (
          <div className="bg-emerald-600 text-white px-8 py-2 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check size={16} /> {successMsg}
          </div>
        )}

        <div className="flex-1 overflow-auto p-8 bg-[#f8f9fa]">
          <Outlet />
        </div>
      </main>

      {/* MODAL SUPERADMIN: KIRIM PERINGATAN / NOTIFIKASI KE STAF */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Send size={18} className="text-[#0a5c36]" /> Kirim Peringatan ke Staf
              </h3>
              <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Judul Peringatan / Notifikasi</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Peringatan Jatuh Tempo / Instruksi Shift"
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({...notifForm, title: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tipe Peringatan</label>
                <select 
                  value={notifForm.type}
                  onChange={(e) => setNotifForm({...notifForm, type: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                >
                  <option value="warning">Peringatan (Warning)</option>
                  <option value="danger">Penting / Kritis (Danger)</option>
                  <option value="info">Informasi Umum (Info)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pesan / Instruksi Peringatan</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Masukkan rincian pesan peringatan atau pengingat yang ingin disampaikan ke staf..."
                  value={notifForm.description}
                  onChange={(e) => setNotifForm({...notifForm, description: e.target.value})}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0a5c36]"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0a5c36] text-white rounded-xl font-bold text-xs flex justify-center items-center gap-2 hover:bg-[#08482a] transition-all shadow-sm"
                >
                  <Send size={14} /> Kirim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}