import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { MoreVertical, Trash2, Clock } from 'lucide-react';

const Transactions = () => {
  const [list, setList] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [loading, setLoading] = useState(true);
  const menuRef = useRef(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions');
      setList(res.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTransactions();
    const closeMenu = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null); };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Haqiqatdan ham o'chirmoqchimisiz?")) {
      try {
        await API.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (err) { alert("O'chirishda xatolik!"); }
    }
  };

  const format = (n) => new Intl.NumberFormat().format(Math.abs(n));
  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('uz-UZ', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Amallar Tarixi</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <th className="px-6 py-4">Sana va Vaqt</th>
              <th className="px-6 py-4">Foydalanuvchi</th>
              <th className="px-6 py-4 text-center">USD ($)</th>
              <th className="px-6 py-4 text-center">UZS (So'm)</th>
              <th className="px-6 py-4 text-right">Boshqaruv</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Clock size={14} className="opacity-50" /> {formatDate(item.createdAt || item.date)}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 capitalize">{item.person_name}</td>
                <td className={`px-6 py-4 text-center font-black ${item.amount_usd > 0 ? 'text-emerald-500' : item.amount_usd < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                  {item.amount_usd > 0 ? '+' : item.amount_usd < 0 ? '-' : ''}{format(item.amount_usd)} $
                </td>
                <td className={`px-6 py-4 text-center font-black ${item.amount_uzs > 0 ? 'text-emerald-500' : item.amount_uzs < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                  {item.amount_uzs > 0 ? '+' : item.amount_uzs < 0 ? '-' : ''}{format(item.amount_uzs)}
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><MoreVertical size={18} /></button>
                  {activeMenu === item.id && (
                    <div ref={menuRef} className="absolute right-12 top-0 z-50 w-40 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border dark:border-slate-700 p-1">
                      <button onClick={() => handleDelete(item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={14} /> O'CHIRISH
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;