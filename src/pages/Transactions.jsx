import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { 
  MoreVertical, Trash2, Clock, Edit2, X, 
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

const Transactions = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  
  // Modallar uchun state
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
    const closeMenu = (e) => { 
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null); 
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  // Xabarnoma ko'rsatish
  const showNote = (type, title, message) => {
    setNotification({ show: true, type, title, message });
    if (type === 'success') setTimeout(() => setNotification(p => ({ ...p, show: false })), 2000);
  };

  // O'chirish funksiyasi
  const askDelete = (id) => {
    setConfirmModal({ show: true, id });
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/transactions/${confirmModal.id}`);
      setConfirmModal({ show: false, id: null });
      showNote('success', 'O\'chirildi', 'Ma’lumot muvaffaqiyatli o‘chirildi');
      fetchTransactions();
    } catch (err) {
      showNote('error', 'Xatolik', 'O‘chirishda muammo yuz berdi');
    }
  };

  // Tahrirlashni boshlash
  const startEdit = (item) => {
    setEditModal({
      show: true,
      data: {
        ...item,
        usd_type: item.amount_usd >= 0 ? 'gave' : 'took',
        uzs_type: item.amount_uzs >= 0 ? 'gave' : 'took',
        amount_usd: Math.abs(item.amount_usd),
        amount_uzs: Math.abs(item.amount_uzs)
      }
    });
    setActiveMenu(null);
  };

  // Tahrirni saqlash
  const handleUpdate = async () => {
    const { data } = editModal;
    if(!data.person_name.trim()) return showNote('error', 'Xato', 'Ismni kiriting');

    try {
      const payload = {
        person_name: data.person_name,
        amount_usd: data.usd_type === 'took' ? -Math.abs(data.amount_usd) : Math.abs(data.amount_usd),
        amount_uzs: data.uzs_type === 'took' ? -Math.abs(data.amount_uzs) : Math.abs(data.amount_uzs),
      };

      await API.put(`/transactions/${data.id}`, payload);
      setEditModal({ show: false, data: null });
      showNote('success', 'Yangilandi', 'Ma’lumot muvaffaqiyatli saqlandi');
      fetchTransactions();
    } catch (err) {
      showNote('error', 'Xatolik', 'Serverda yangilash imkoni bo‘lmadi');
    }
  };

  const format = (n) => new Intl.NumberFormat().format(Math.abs(n));
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('uz-UZ', { 
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse">Yuklanmoqda...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative">
      
      {/* 1. Xabarnoma Modali */}
      {notification.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-[2rem] p-6 text-center shadow-2xl border dark:border-slate-700 animate-in zoom-in duration-200">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <h4 className="text-lg font-bold dark:text-white">{notification.title}</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">{notification.message}</p>
            {notification.type === 'error' && <button onClick={() => setNotification({show:false})} className="w-full py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-bold dark:text-white font-black uppercase tracking-widest">Yopish</button>}
          </div>
        </div>
      )}

      {/* 2. Tasdiqlash Modali */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">O'chirilsinmi?</h3>
            <p className="text-slate-500 text-sm mt-2 mb-8 font-medium">Ushbu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({show:false, id:null})} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 rounded-2xl font-bold dark:text-white uppercase text-[11px] tracking-widest transition-all hover:bg-slate-200">Bekor qilish</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 dark:shadow-none uppercase text-[11px] tracking-widest transition-all hover:bg-rose-600">O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tahrirlash Modali (RESPONSIVE) */}
      {editModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border dark:border-slate-700 overflow-hidden animate-in zoom-in duration-200">
            
            <div className="p-6 md:p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Tahrirlash</h3>
              <button onClick={() => setEditModal({show:false, data:null})} className="p-3 bg-white dark:bg-slate-700 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm"><X size={20}/></button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Shaxs ismi</label>
                <input className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none dark:text-white font-bold text-lg transition-all" value={editModal.data.person_name} onChange={e => setEditModal({...editModal, data: {...editModal.data, person_name: e.target.value}})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* USD Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dollar ($)</span>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full ${editModal.data.usd_type === 'gave' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {editModal.data.usd_type === 'gave' ? 'BERDIM (+)' : 'OLDIM (-)'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" className="flex-1 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl outline-none dark:text-white font-black text-xl" value={editModal.data.amount_usd} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_usd: e.target.value}})} />
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: editModal.data.usd_type === 'gave' ? 'took' : 'gave'}})} className={`p-4 rounded-xl transition-all shadow-sm ${editModal.data.usd_type === 'gave' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {editModal.data.usd_type === 'gave' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
                    </button>
                  </div>
                </div>

                {/* UZS Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">So'm (UZS)</span>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full ${editModal.data.uzs_type === 'gave' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {editModal.data.uzs_type === 'gave' ? 'BERDIM (+)' : 'OLDIM (-)'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" className="flex-1 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl outline-none dark:text-white font-black text-xl" value={editModal.data.amount_uzs} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_uzs: e.target.value}})} />
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: editModal.data.uzs_type === 'gave' ? 'took' : 'gave'}})} className={`p-4 rounded-xl transition-all shadow-sm ${editModal.data.uzs_type === 'gave' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {editModal.data.uzs_type === 'gave' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleUpdate} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest mt-4">Saqlash</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
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
                <td className="px-6 py-4 whitespace-nowrap">
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