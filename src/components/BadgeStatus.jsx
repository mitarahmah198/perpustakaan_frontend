import React from 'react';

/**
 * Reusable Badge Status Komponen.
 * @param {Object} props
 * @param {string} props.status - Status text (e.g. 'Aktif', 'Non-Aktif', 'Dipinjam', 'Dikembalikan', 'Terlambat')
 * @param {string} [props.type] - Preset type: 'success', 'warning', 'danger', 'info', 'neutral'
 */
export default function BadgeStatus({ status, type }) {
  const getStyle = () => {
    if (type) {
      switch (type) {
        case 'success':
          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'warning':
          return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'danger':
          return 'bg-rose-100 text-rose-800 border-rose-200';
        case 'info':
          return 'bg-sky-100 text-sky-800 border-sky-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }

    const lower = String(status || '').toLowerCase();
    if (lower === 'aktif' || lower === 'dikembalikan' || lower === 'tersedia') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (lower === 'dipinjam' || lower === 'hari ini') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (lower === 'terlambat' || lower === 'non-aktif' || lower === 'habis') {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()}`}>
      {status}
    </span>
  );
}
