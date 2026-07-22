import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Akses Ditolak</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Anda tidak memiliki hak akses (role) yang sesuai untuk membuka halaman ini. Halaman ini terbatas hanya untuk <strong className="text-gray-700">Super Admin</strong>.
        </p>
        <div className="pt-4 border-t border-gray-100">
          <Link 
            to="/" 
            className="w-full py-3 bg-[#0a5c36] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#08482a] transition-all shadow-sm"
          >
            <ArrowLeft size={18} /> KEMBALI KE DASBOR
          </Link>
        </div>
      </div>
    </div>
  );
}
