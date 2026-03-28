import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { MoreVertical, Edit2, Trash2, X, CheckCircle, ChevronDown } from 'lucide-react';

const Transactions = () => {
  const [list, setList] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [editModal, setEditModal] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  const menuRef = useRef(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions');
      setList(res.data || []);
    } catch (err) { 
      console.error("Ma'lumot olishda xato:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchTransactions();
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Haqiqatdan ham ushbu ma'lumotni o'chirmoqchimisiz?")) {
      try {
        await API.delete(`/transactions/${id}`);
        fetchTransactions();
        setActiveMenu(null);
      } catch (err) {
        alert("O'chirishda xatolik yuz berdi");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        person_name: editModal.person_name,
        type: editModal.type,
        amount_usd: parseFloat(editModal.amount_usd) || 0,
        amount_uzs: parseFloat(editModal.amount_uzs) || 0
      };
      await API.put(`/transactions/${editModal.id}`, payload);
      setEditModal(null);
      fetchTransactions();
    } catch (err) {
      alert("Yangilashda xatolik yuz berdi");
    }
  };

  const format = (n) => new Intl.NumberFormat().format(n);

  if (loading) return <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-bold">Yuklanmoqda...</div>;

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative transition-all">
      <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white tracking-tight">Amallar Ro'yxati</h2>

      <div className="overflow-x-auto min-h-[450px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Ism / Shaxs</th>
              <th className="px-6 py-4 font-semibold text-center">USD ($)</th>
              <th className="px-6 py-4 font-semibold text-center">UZS (So'm)</th>
              <th className="px-6 py-4 font-semibold text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200 capitalize">{item.person_name}</td>
                <td className={`px-6 py-4 text-center font-bold ${item.type === 'gave' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                   {item.type === 'took' ? '-' : '+'}{format(item.amount_usd)}
                </td>
                <td className={`px-6 py-4 text-center font-bold ${item.type === 'gave' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                   {format(item.amount_uzs)}
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                    className={`p-2 rounded-full transition-all ${activeMenu === item.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {activeMenu === item.id && (
                    <div ref={menuRef} className="absolute right-12 top-0 z-[60] w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-2xl p-1.5 ring-4 ring-slate-50/50 dark:ring-0 transition-all">
                      <button 
                        onClick={() => { setEditModal(item); setActiveMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                      >
                        <Edit2 size={14} /> TAHRIRLASH
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                      >
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

      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[32px] shadow-2xl p-8 border border-white/20 dark:border-slate-700 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Tahrirlash</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Ma'lumotlarni yangilash</p>
              </div>
              <button 
                onClick={() => setEditModal(null)} 
                className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Shaxs ismi</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent p-4 rounded-2xl focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 dark:text-white"
                  value={editModal.person_name}
                  onChange={e => setEditModal({...editModal, person_name: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Amal turi</label>
                <div className="relative group">
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent p-4 rounded-2xl focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-white appearance-none cursor-pointer"
                    value={editModal.type}
                    onChange={e => setEditModal({...editModal, type: e.target.value})}
                  >
                    <option value="gave">Berdim (Haqim / +)</option>
                    <option value="took">Oldim (Qarzim / -)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">USD ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent p-4 rounded-2xl focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                    value={editModal.amount_usd}
                    onChange={e => setEditModal({...editModal, amount_usd: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">UZS (So'm)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent p-4 rounded-2xl focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-200"
                    value={editModal.amount_uzs}
                    onChange={e => setEditModal({...editModal, amount_uzs: e.target.value})}
                  />
                </div>
              </div>
              
              <button 
                onClick={handleUpdate}
                className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-sm mt-6 shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                <CheckCircle size={18} /> SAQLASH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;