import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { 
  MoreVertical, Trash2, Clock, Edit2, X, 
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, User, DollarSign
} from 'lucide-react';

const Transactions = () => {
  const [list, setList] = useState([]);
  const [kurs, setKurs] = useState(0); // Kurs uchun state
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

  const fetchKurs = async () => {
    try {
      const res = await API.get('/settings/usd-rate');
      setKurs(parseFloat(res.data.rate));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTransactions();
    fetchKurs(); // Kursni yuklash
    const closeMenu = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null); };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  // Kalkulyator funksiyasi
  const calculateInput = (value) => {
    try {
      if (/[+\-*/]/.test(value)) {
        const result = new Function(`return ${value.replace(/[^-()\d/*+.]/g, '')}`)();
        return result.toString();
      }
      return value;
    } catch (e) { return value; }
  };

  const handleEditKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      const result = calculateInput(e.target.value);
      setEditModal({
        ...editModal,
        data: { ...editModal.data, [field]: result }
      });
    }
  };

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
      const finalUsd = calculateInput(data.amount_usd.toString());
      const finalUzs = calculateInput(data.amount_uzs.toString());

      const payload = {
        person_name: data.person_name,
        amount_usd: data.usd_type === 'took' ? -Math.abs(finalUsd) : Math.abs(finalUsd),
        amount_uzs: data.uzs_type === 'took' ? -Math.abs(finalUzs) : Math.abs(finalUzs)
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

  // Umumiy balansni hisoblash
  const totals = list.reduce((acc, curr) => {
    acc.usd += (parseFloat(curr.amount_usd) || 0);
    acc.uzs += (parseFloat(curr.amount_uzs) || 0);
    return acc;
  }, { usd: 0, uzs: 0 });

  const totalInUsd = totals.usd + (totals.uzs / (kurs || 1));

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="space-y-4">
      {/* TEPADA KURS KO'RINIB TURADIGAN QISM */}
      <div className="flex justify-end">
        <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold">
          1$ = {new Intl.NumberFormat().format(kurs)} UZS
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative">
        
        {/* Notification, Confirm va Edit Modallar shu yerda (o'zgarishsiz qoldi) */}
        {notification.show && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border dark:border-slate-700">
              <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <h4 className="font-bold dark:text-white">{notification.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
            </div>
          </div>
        )}

        {confirmModal.show && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl border dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">O'chirilsinmi?</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8">Bu amalni bekor qilib bo'lmaydi.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal({show:false, id:null})} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold dark:text-white transition-colors hover:bg-slate-200">Bekor qilish</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold transition-colors hover:bg-rose-600">O'chirish</button>
              </div>
            </div>
          </div>
        )}

        {editModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl border dark:border-slate-700 overflow-hidden">
              <div className="px-8 py-6 border-b dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Tahrirlash</h3>
                <button onClick={() => setEditModal({show:false, data:null})} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Foydalanuvchi ismi</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input className="w-full bg-slate-50 dark:bg-slate-900 pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 dark:text-white font-bold transition-all" value={editModal.data.person_name} onChange={e => setEditModal({...editModal, data: {...editModal.data, person_name: e.target.value}})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                     <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase px-3">Dollar ($)</label>
                        <input type="text" className="w-full bg-transparent px-3 py-1 outline-none dark:text-white font-black text-lg" value={editModal.data.amount_usd} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_usd: e.target.value}})} onKeyDown={(e) => handleEditKeyDown(e, 'amount_usd')} />
                     </div>
                     <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                        <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'gave'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.usd_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                        <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'took'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.usd_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                     <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase px-3">So'm (UZS)</label>
                        <input type="text" className="w-full bg-transparent px-3 py-1 outline-none dark:text-white font-black text-lg" value={editModal.data.amount_uzs} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_uzs: e.target.value}})} onKeyDown={(e) => handleEditKeyDown(e, 'amount_uzs')} />
                     </div>
                     <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                        <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'gave'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.uzs_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                        <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'took'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.uzs_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                     </div>
                  </div>
                </div>
                <button onClick={handleUpdate} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 uppercase tracking-widest transition-all">Saqlash</button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Tarix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 text-[9px] uppercase font-black tracking-widest border-b dark:border-slate-700">
                <th className="px-4 py-3">Vaqt</th>
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3 text-center">USD ($)</th>
                <th className="px-4 py-3 text-center">UZS (So'm)</th>
                <th className="px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-1.5"><Clock size={11}/> {formatDate(item.createdAt || item.date)}</div>
                  </td>
                  <td className="px-4 py-2 font-black text-slate-900 dark:text-slate-100 text-sm capitalize">{item.person_name}</td>
                  <td className={`px-4 py-2 text-center font-black text-sm ${item.amount_usd > 0 ? 'text-emerald-600' : item.amount_usd < 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                    {item.amount_usd > 0 ? '+' : item.amount_usd < 0 ? '-' : ''}{format(item.amount_usd)} $
                  </td>
                  <td className={`px-4 py-2 text-center font-black text-sm ${item.amount_uzs > 0 ? 'text-emerald-600' : item.amount_uzs < 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                    {item.amount_uzs > 0 ? '+' : item.amount_uzs < 0 ? '-' : ''}{format(item.amount_uzs)}
                  </td>
                  <td className="px-4 py-2 text-right relative">
                    <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><MoreVertical size={16} /></button>
                    {activeMenu === item.id && (
                      <div ref={menuRef} className="absolute right-10 top-0 z-50 w-40 bg-white dark:bg-slate-900 shadow-xl rounded-xl border dark:border-slate-700 p-1 ring-2 ring-black/5">
                        <button onClick={() => startEdit(item)} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all">
                          <Edit2 size={13} /> TAHRIRLASH
                        </button>
                        <button onClick={() => askDelete(item.id)} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                          <Trash2 size={13} /> O'CHIRISH
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

      {/* PASDA UMUMIY BALANS KARTI (DOLLARDA) */}
      <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Jami Balans (Dollarda hisoblanganda)</p>
        <h2 className="text-3xl font-black mt-2">
          {new Intl.NumberFormat().format(totalInUsd.toFixed(2))} $
        </h2>
        <DollarSign className="absolute -right-4 -bottom-4 opacity-10" size={120} />
      </div>
    </div>
  );
};

export default Transactions;