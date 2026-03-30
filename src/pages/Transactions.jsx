import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { 
  MoreVertical, Trash2, Clock, Edit2, X, 
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, User
} from 'lucide-react';

const Transactions = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
  const [editModal, setEditModal] = useState({ show: false, data: null });

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

  const showNote = (type, title, message) => {
    setNotification({ show: true, type, title, message });
    if (type === 'success') setTimeout(() => setNotification(p => ({ ...p, show: false })), 2000);
  };

  const askDelete = (id) => {
    setConfirmModal({ show: true, id });
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/transactions/${confirmModal.id}`);
      setConfirmModal({ show: false, id: null });
      showNote('success', 'O\'chirildi', 'Muvaffaqiyatli o\'chirildi');
      fetchTransactions();
    } catch (err) { showNote('error', 'Xatolik', 'Xato yuz berdi'); }
  };

  const startEdit = (item) => {
    setEditModal({
      show: true,
      data: {
        ...item,
        // Backenddan kelgan qiymatga qarab turini aniqlash
        usd_type: parseFloat(item.amount_usd) >= 0 ? 'gave' : 'took',
        uzs_type: parseFloat(item.amount_uzs) >= 0 ? 'gave' : 'took',
        amount_usd: Math.abs(item.amount_usd) || '',
        amount_uzs: Math.abs(item.amount_uzs) || ''
      }
    });
    setActiveMenu(null);
  };

  const handleUpdate = async () => {
    const { data } = editModal;
    if(!data.person_name.trim()) return showNote('error', 'Xato', 'Ismni kiriting');

    try {
      const payload = {
        person_name: data.person_name,
        amount_usd: data.usd_type === 'took' ? -Math.abs(data.amount_usd) : Math.abs(data.amount_usd),
        amount_uzs: data.uzs_type === 'took' ? -Math.abs(data.amount_uzs) : Math.abs(data.amount_uzs)
      };

      await API.put(`/transactions/${data.id}`, payload);
      setEditModal({ show: false, data: null });
      showNote('success', 'Yangilandi', 'Ma’lumot saqlandi');
      fetchTransactions();
    } catch (err) { showNote('error', 'Xatolik', 'Yangilashda xato'); }
  };

  const format = (n) => new Intl.NumberFormat().format(Math.abs(n));
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('uz-UZ', { 
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative">
      
      {/* Notification Modal */}
      {notification.show && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border dark:border-slate-700 animate-in slide-in-from-bottom-4">
            <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </div>
            <h4 className="font-bold dark:text-white">{notification.title}</h4>
            <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl border dark:border-slate-700 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">O'chirilsinmi?</h3>
            <p className="text-slate-500 text-sm mt-2 mb-8">Bu amalni bekor qilib bo'lmaydi.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({show:false, id:null})} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold dark:text-white transition-colors hover:bg-slate-200">Bekor qilish</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold transition-colors hover:bg-rose-600">O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - JIDDIY VA TARTIBLI DIZAYN */}
      {editModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl border dark:border-slate-700 overflow-hidden animate-in zoom-in-95">
            
            <div className="px-8 py-6 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Tahrirlash</h3>
              <button onClick={() => setEditModal({show:false, data:null})} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-6">
              {/* Ism */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Foydalanuvchi ismi</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="w-full bg-slate-50 dark:bg-slate-900 pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 dark:text-white font-bold transition-all" value={editModal.data.person_name} onChange={e => setEditModal({...editModal, data: {...editModal.data, person_name: e.target.value}})} />
                </div>
              </div>

              {/* Valyuta bloklari */}
              <div className="grid grid-cols-1 gap-4">
                {/* USD */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                   <div className="flex-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase px-3">Dollar ($)</label>
                      <input type="number" className="w-full bg-transparent px-3 py-1 outline-none dark:text-white font-black text-lg" value={editModal.data.amount_usd} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_usd: e.target.value}})} placeholder="0.00" />
                   </div>
                   <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                      <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'gave'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.usd_type === 'gave' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>BERDIM</button>
                      <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'took'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.usd_type === 'took' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>OLDIM</button>
                   </div>
                </div>

                {/* UZS */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                   <div className="flex-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase px-3">So'm (UZS)</label>
                      <input type="number" className="w-full bg-transparent px-3 py-1 outline-none dark:text-white font-black text-lg" value={editModal.data.amount_uzs} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_uzs: e.target.value}})} placeholder="0" />
                   </div>
                   <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                      <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'gave'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.uzs_type === 'gave' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>BERDIM</button>
                      <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'took'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.uzs_type === 'took' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>OLDIM</button>
                   </div>
                </div>
              </div>

              <button onClick={handleUpdate} className="w-full bg-slate-800 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all uppercase tracking-widest">Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* JADVAL */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Amallar Tarixi</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <th className="px-6 py-4">Vaqt</th>
              <th className="px-6 py-4">Foydalanuvchi</th>
              <th className="px-6 py-4 text-center">USD ($)</th>
              <th className="px-6 py-4 text-center">UZS (So'm)</th>
              <th className="px-6 py-4 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-[11px] font-medium text-slate-400">
                  <div className="flex items-center gap-2"><Clock size={12}/> {formatDate(item.createdAt || item.date)}</div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 capitalize">{item.person_name}</td>
                <td className={`px-6 py-4 text-center font-black ${item.amount_usd > 0 ? 'text-emerald-500' : item.amount_usd < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                  {item.amount_usd > 0 ? '+' : item.amount_usd < 0 ? '-' : ''}{format(item.amount_usd)} $
                </td>
                <td className={`px-6 py-4 text-center font-black ${item.amount_uzs > 0 ? 'text-emerald-500' : item.amount_uzs < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                  {item.amount_uzs > 0 ? '+' : item.amount_uzs < 0 ? '-' : ''}{format(item.amount_uzs)}
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><MoreVertical size={18} /></button>
                  {activeMenu === item.id && (
                    <div ref={menuRef} className="absolute right-12 top-0 z-50 w-44 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border dark:border-slate-700 p-1.5 ring-4 ring-black/5">
                      <button onClick={() => startEdit(item)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                        <Edit2 size={14} /> TAHRIRLASH
                      </button>
                      <button onClick={() => askDelete(item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
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