import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Buku from './pages/Buku';
import Anggota from './pages/Anggota';
import Peminjaman from './pages/Peminjaman';
import Pengembalian from './pages/Pengembalian';
import Laporan from './pages/Laporan';
import Profil from './pages/Profil';
import Pengaturan from './pages/Pengaturan';
import ManajemenPengguna from './pages/ManajemenPengguna';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes: Membutuhkan Login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              
              {/* Route BERSAMA (Staf & Super Admin) */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dasbor" element={<Dashboard />} />

              <Route path="/buku" element={<Buku />} />
              <Route path="/anggota" element={<Anggota />} />
              <Route path="/peminjaman" element={<Peminjaman />} />
              <Route path="/pengembalian" element={<Pengembalian />} />
              <Route path="/laporan" element={<Laporan />} />
              <Route path="/profil" element={<Profil />} />

              {/* Route KHUSUS Super Admin */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                <Route path="/pengaturan" element={<Pengaturan />} />
                <Route path="/pengguna" element={<ManajemenPengguna />} />
              </Route>

            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;