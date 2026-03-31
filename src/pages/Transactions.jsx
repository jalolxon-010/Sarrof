import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { 
  MoreVertical, Trash2, Clock, Edit2, X, 
  CheckCircle2, AlertCircle, User, DollarSign, Plus, Wallet
} from 'lucide-react';

const Transactions = () => {
  const [list, setList] = useState([]);
  const [kurs, setKurs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
  const [editModal, setEditModal] = useState({ show: false, data: null });
  const [addModal, setAddModal] = useState({ show: false, person_name: '', amount_usd: '', amount_uzs: '', usd_type: 'gave', uzs_type: 'gave' });

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
    fetchKurs();
    const closeMenu = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null); };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const calculateInput = (value) => {
    try {
      if (/[+\-*/]/.test(value)) {
        const result = new Function(`return ${value.replace(/[^-()\d/*+.]/g, '')}`)();
        return result.toString();
      }
      return value;
    } catch (e) { return value; }
  };

  const showNote = (type, title, message) => {
    setNotification({ show: true, type, title, message });
    if (type === 'success') setTimeout(() => setNotification(p => ({ ...p, show: false })), 2000);
  };

  const handleAdd = async () => {
    if(!addModal.person_name.trim()) return showNote('error', 'Xato', 'Ismni kiriting');
    try {
      const usd = calculateInput(addModal.amount_usd.toString() || "0");
      const uzs = calculateInput(addModal.amount_uzs.toString() || "0");
      
      const payload = {
        person_name: addModal.person_name,
        amount_usd: addModal.usd_type === 'took' ? -Math.abs(usd) : Math.abs(usd),
        amount_uzs: addModal.uzs_type === 'took' ? -Math.abs(uzs) : Math.abs(uzs)
      };
      await API.post('/transactions', payload);
      setAddModal({ show: false, person_name: '', amount_usd: '', amount_uzs: '', usd_type: 'gave', uzs_type: 'gave' });
      showNote('success', 'Qo\'shildi', 'Yangi qarz muvaffaqiyatli qo\'shildi');
      fetchTransactions();
    } catch (err) { showNote('error', 'Xatolik', 'Saqlashda xato yuz berdi'); }
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/transactions/${confirmModal.id}`);
      setConfirmModal({ show: false, id: null });
      showNote('success', 'O\'chirildi', 'Muvaffaqiyatli o\'chirildi');
      fetchTransactions();
    } catch (err) { showNote('error', 'Xatolik', 'Xato yuz berdi'); }
  };

  const handleUpdate = async () => {
    const { data } = editModal;
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
  
  // Balanslarni hisoblash
  const totals = list.reduce((acc, curr) => {
    acc.usd += (parseFloat(curr.amount_usd) || 0);
    acc.uzs += (parseFloat(curr.amount_uzs) || 0);
    return acc;
  }, { usd: 0, uzs: 0 });
  const totalInUsd = totals.usd + (totals.uzs / (kurs || 1));

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. KURS QISMI */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase">Boshqaruv</h1>
        <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold">
          1$ = {new Intl.NumberFormat().format(kurs)} UZS
        </div>
      </div>

      {/* 2. BALANS VIDJETLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jami USD</p>
          <h3 className={`text-2xl font-black mt-1 ${totals.usd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totals.usd >= 0 ? '+' : '-'}{format(totals.usd)} $
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jami UZS</p>
          <h3 className={`text-2xl font-black mt-1 ${totals.uzs >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totals.uzs >= 0 ? '+' : '-'}{format(totals.uzs)}
          </h3>
        </div>
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Umumiy (USD da)</p>
          <h3 className="text-2xl font-black mt-1 relative z-10">{format(totalInUsd.toFixed(2))} $</h3>
          <DollarSign className="absolute -right-2 -bottom-2 opacity-10" size={80} />
        </div>
      </div>

      {/* 3. QARZDOR QO'SHISH TUGMASI */}
      <button 
        onClick={() => setAddModal({ ...addModal, show: true })}
        className="w-full py-4 bg-slate-900 dark:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl uppercase tracking-widest"
      >
        <Plus size={20} /> Qarzdor Qo'shish
      </button>

      {/* 4. JADVAL QISMI */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Amallar Tarixi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[9px] uppercase font-black tracking-widest">
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3 text-center">USD ($)</th>
                <th className="px-4 py-3 text-center">UZS (So'm)</th>
                <th className="px-4 py-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-4 py-2">
                    <div className="font-black text-slate-900 dark:text-slate-100 text-sm capitalize">{item.person_name}</div>
                    <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10}/>{new Date(item.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className={`px-4 py-2 text-center font-black text-sm ${item.amount_usd > 0 ? 'text-emerald-600' : item.amount_usd < 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                    {item.amount_usd > 0 ? '+' : item.amount_usd < 0 ? '-' : ''}{format(item.amount_usd)} $
                  </td>
                  <td className={`px-4 py-2 text-center font-black text-sm ${item.amount_uzs > 0 ? 'text-emerald-600' : item.amount_uzs < 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                    {item.amount_uzs > 0 ? '+' : item.amount_uzs < 0 ? '-' : ''}{format(item.amount_uzs)}
                  </td>
                  <td className="px-4 py-2 text-right relative">
                    <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="p-1.5 text-slate-300 hover:text-indigo-600"><MoreVertical size={16} /></button>
                    {activeMenu === item.id && (
                      <div ref={menuRef} className="absolute right-10 top-0 z-50 w-40 bg-white dark:bg-slate-900 shadow-2xl rounded-xl border dark:border-slate-700 p-1 ring-4 ring-black/5">
                        <button onClick={() => { setActiveMenu(null); setEditModal({ show: true, data: { ...item, usd_type: item.amount_usd >= 0 ? 'gave' : 'took', uzs_type: item.amount_uzs >= 0 ? 'gave' : 'took', amount_usd: Math.abs(item.amount_usd), amount_uzs: Math.abs(item.amount_uzs) } }); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 rounded-lg">
                          <Edit2 size={13} /> TAHRIRLASH
                        </button>
                        <button onClick={() => { setActiveMenu(null); setConfirmModal({ show: true, id: item.id }); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded-lg">
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

      {/* MODALLAR (Add, Edit, Confirm, Notification) */}
      {/* ... notification va confirmModal kodi ... */}
      {addModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-black dark:text-white uppercase tracking-widest text-slate-800">Yangi Qarz</h3>
              <button onClick={() => setAddModal({ ...addModal, show: false })} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ism</label>
                <input className="w-full bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-500/20 dark:text-white font-bold" value={addModal.person_name} onChange={e => setAddModal({...addModal, person_name: e.target.value})} placeholder="Ismni kiriting..." />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                  <div className="flex-1 px-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">USD ($)</label>
                    <input type="text" className="w-full bg-transparent outline-none dark:text-white font-black text-lg" value={addModal.amount_usd} onChange={e => setAddModal({...addModal, amount_usd: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                    <button onClick={() => setAddModal({...addModal, usd_type: 'gave'})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${addModal.usd_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setAddModal({...addModal, usd_type: 'took'})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${addModal.usd_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                  <div className="flex-1 px-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">UZS (So'm)</label>
                    <input type="text" className="w-full bg-transparent outline-none dark:text-white font-black text-lg" value={addModal.amount_uzs} onChange={e => setAddModal({...addModal, amount_uzs: e.target.value})} placeholder="0" />
                  </div>
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                    <button onClick={() => setAddModal({...addModal, uzs_type: 'gave'})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${addModal.uzs_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setAddModal({...addModal, uzs_type: 'took'})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${addModal.uzs_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
              </div>
              <button onClick={handleAdd} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest hover:bg-indigo-700 transition-all">Qarzni Qo'shish</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Tahrirlash uchun) */}
      {editModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
             <div className="px-8 py-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-black dark:text-white uppercase tracking-widest text-slate-800">Tahrirlash</h3>
              <button onClick={() => setEditModal({show:false, data:null})} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ism</label>
                <input className="w-full bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-2xl outline-none border-2 border-transparent focus:border-indigo-500/20 dark:text-white font-bold" value={editModal.data.person_name} onChange={e => setEditModal({...editModal, data: {...editModal.data, person_name: e.target.value}})} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                  <div className="flex-1 px-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">USD ($)</label>
                    <input type="text" className="w-full bg-transparent outline-none dark:text-white font-black text-lg" value={editModal.data.amount_usd} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_usd: e.target.value}})} />
                  </div>
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'gave'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.usd_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'took'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.usd_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-700">
                  <div className="flex-1 px-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">UZS (So'm)</label>
                    <input type="text" className="w-full bg-transparent outline-none dark:text-white font-black text-lg" value={editModal.data.amount_uzs} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_uzs: e.target.value}})} />
                  </div>
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'gave'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.uzs_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'took'}})} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${editModal.data.uzs_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
              </div>
              <button onClick={handleUpdate} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest hover:opacity-90 transition-all">Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl border dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">O'chirilsinmi?</h3>
            <p className="text-slate-500 text-sm mt-2 mb-8">Bu amalni bekor qilib bo'lmaydi.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({show:false, id:null})} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold transition-colors">Bekor</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold transition-colors">O'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xs animate-in slide-in-from-bottom-5">
           <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-rose-600 border-rose-100'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-bold text-xs">{notification.message}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;