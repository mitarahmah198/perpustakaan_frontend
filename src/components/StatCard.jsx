import React from 'react';

/**
 * Reusable StatCard Komponen untuk menampilkan metrik statistik.
 * @param {Object} props
 * @param {string} props.title - Judul metrik
 * @param {string|number} props.value - Nilai metrik
 * @param {React.ReactNode} props.icon - Element ikon
 * @param {string} [props.bgColor] - Background color ikon container
 * @param {string} [props.subtext] - Teks penjelas tambahan
 */
export default function StatCard({ title, value, icon, bgColor = 'bg-emerald-50 text-[#0a5c36]', subtext }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
