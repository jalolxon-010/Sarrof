import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { 
  MoreVertical, Trash2, Clock, Edit2, X, 
  CheckCircle2, AlertCircle, DollarSign, Plus, 
  Lock as LockIcon 
} from 'lucide-react';

// --- 1. QULF EKRANI KOMPONENTI (HAR KIRGANDA SO'RALADI) ---
const LockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const correctPin = "1111"; // O'Z PAROLINGIZNI SHU YERGA YOZING

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pin === correctPin) {
      sessionStorage.setItem("isUnlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0f172a] flex flex-col items-center justify-center p-6 backdrop-blur-xl">
      <div className={`w-full max-w-xs text-center space-y-8 ${error ? 'animate-shake' : ''}`}>
        <div className="mx-auto w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
          <LockIcon className="text-white" size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Xavfsiz Kirish</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Parolni kiriting</p>
        </div>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input 
            type="password" autoFocus inputMode="numeric" value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={`w-full bg-slate-900 border-2 ${error ? 'border-rose-500' : 'border-slate-800'} rounded-2xl py-4 text-center text-2xl tracking-[0.5em] font-black text-white outline-none focus:border-indigo-500 transition-all`}
            placeholder="****" maxLength={4}
          />
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all">
            KIRISH
          </button>
        </form>
      </div>
      <style px-4>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

// --- 2. ASOSIY TRANSACTIONS KOMPONENTI ---
const Transactions = () => {
  const [isUnlocked, setIsUnlocked] = useState(sessionStorage.getItem("isUnlocked") === "true");
  const [list, setList] = useState([]);
  const [kurs, setKurs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
  const [editModal, setEditModal] = useState({ show: false, data: null });
  const [addModal, setAddModal] = useState({ show: false, person_name: '', amount_usd: '', amount_uzs: '', usd_type: 'gave', uzs_type: 'gave' });

  const menuRef = useRef(null);

  useEffect(() => {
    if (isUnlocked) {
      fetchTransactions();
      fetchKurs();
    }
    const closeMenu = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null); };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [isUnlocked]);

  const fetchTransactions = async () => {
    try { setLoading(true); const res = await API.get('/transactions'); setList(res.data || []); } 
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchKurs = async () => {
    try { const res = await API.get('/settings/usd-rate'); setKurs(parseFloat(res.data.rate)); } 
    catch (e) { console.error(e); }
  };

  const calculateInput = (v) => { try { return /[+\-*/]/.test(v) ? new Function(`return ${v.replace(/[^-()\d/*+.]/g, '')}`)().toString() : v; } catch { return v; } };

  const showNote = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(p => ({ ...p, show: false })), 2000);
  };

  const handleAdd = async () => {
    if(!addModal.person_name.trim()) return showNote('error', 'Ismni kiriting');
    try {
      const usd = calculateInput(addModal.amount_usd || "0");
      const uzs = calculateInput(addModal.amount_uzs || "0");
      await API.post('/transactions', {
        person_name: addModal.person_name,
        amount_usd: addModal.usd_type === 'took' ? -Math.abs(usd) : Math.abs(usd),
        amount_uzs: addModal.uzs_type === 'took' ? -Math.abs(uzs) : Math.abs(uzs)
      });
      setAddModal({ show: false, person_name: '', amount_usd: '', amount_uzs: '', usd_type: 'gave', uzs_type: 'gave' });
      showNote('success', 'Muvaffaqiyatli qo\'shildi');
      fetchTransactions();
    } catch { showNote('error', 'Xatolik yuz berdi'); }
  };

  const handleUpdate = async () => {
    const { data } = editModal;
    try {
      const usd = calculateInput(data.amount_usd.toString());
      const uzs = calculateInput(data.amount_uzs.toString());
      await API.put(`/transactions/${data.id}`, {
        person_name: data.person_name,
        amount_usd: data.usd_type === 'took' ? -Math.abs(usd) : Math.abs(usd),
        amount_uzs: data.uzs_type === 'took' ? -Math.abs(uzs) : Math.abs(uzs)
      });
      setEditModal({ show: false, data: null });
      showNote('success', 'Ma’lumot yangilandi');
      fetchTransactions();
    } catch { showNote('error', 'Yangilashda xato'); }
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/transactions/${confirmModal.id}`);
      setConfirmModal({ show: false, id: null });
      showNote('success', 'O\'chirildi');
      fetchTransactions();
    } catch { showNote('error', 'Xatolik yuz berdi'); }
  };

  const format = (n) => new Intl.NumberFormat().format(Math.abs(n));
  const totals = list.reduce((acc, curr) => {
    acc.usd += (parseFloat(curr.amount_usd) || 0);
    acc.uzs += (parseFloat(curr.amount_uzs) || 0);
    return acc;
  }, { usd: 0, uzs: 0 });
  const totalInUsd = totals.usd + (totals.uzs / (kurs || 1));

  if (!isUnlocked) return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  if (loading) return <div className="p-20 text-center font-bold text-slate-500">Yuklanmoqda...</div>;

  return (
    <div className="space-y-4 pb-10 max-w-4xl mx-auto">
      
      {/* KURS VA HEADER */}
      <div className="flex justify-between items-center px-1">
        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Dashboard</h1>
        <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full border border-indigo-500/20 text-[10px] font-black">
          1$ = {new Intl.NumberFormat().format(kurs)}
        </div>
      </div>

      {/* VIDJETLAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">USD</p>
          <h3 className={`text-xl font-black mt-1 ${totals.usd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totals.usd >= 0 ? '+' : '-'}{format(totals.usd)} $
          </h3>
        </div>
        <div className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">UZS</p>
          <h3 className={`text-xl font-black mt-1 ${totals.uzs >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totals.uzs >= 0 ? '+' : '-'}{format(totals.uzs)}
          </h3>
        </div>
        <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-lg relative overflow-hidden">
          <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Jami ($)</p>
          <h3 className="text-xl font-black mt-1 relative z-10">{format(totalInUsd.toFixed(2))} $</h3>
          <DollarSign className="absolute -right-2 -bottom-2 opacity-10" size={60} />
        </div>
      </div>

      {/* QO'SHISH TUGMASI (GRADIENT) */}
      <button 
        onClick={() => setAddModal({ ...addModal, show: true })}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 uppercase tracking-[0.2em] text-[10px] active:scale-[0.98] transition-all"
      >
        <Plus size={16} strokeWidth={3} /> Qarzdor Qo'shish
      </button>

      {/* JADVAL (TO'Q VA IXCHAM) */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-black text-slate-900 dark:text-slate-100 text-[15px] capitalize leading-none tracking-tight">{item.person_name}</div>
                  <div className="text-[9px] text-slate-500 font-bold mt-1 opacity-50 flex items-center gap-1 uppercase"><Clock size={10}/>{new Date(item.createdAt).toLocaleDateString()}</div>
                </td>
                <td className={`px-2 py-3 text-right font-black text-[16px] tracking-tight ${item.amount_usd > 0 ? 'text-[#10b981]' : item.amount_usd < 0 ? 'text-[#ef4444]' : 'text-slate-700 dark:text-slate-500'}`}>
                  {item.amount_usd !== 0 ? `${item.amount_usd > 0 ? '+' : '-'}${format(item.amount_usd)} $` : <span className="opacity-20 text-[12px]">0</span>}
                </td>
                <td className={`px-4 py-3 text-right font-black text-[16px] tracking-tight ${item.amount_uzs > 0 ? 'text-[#10b981]' : item.amount_uzs < 0 ? 'text-[#ef4444]' : 'text-slate-700 dark:text-slate-500'}`}>
                  {item.amount_uzs !== 0 ? `${item.amount_uzs > 0 ? '+' : '-'}${format(item.amount_uzs)}` : <span className="opacity-20 text-[12px]">0</span>}
                </td>
                <td className="pr-4 py-3 text-right w-10 relative">
                  <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)} className="p-1 text-slate-400 hover:text-indigo-500"><MoreVertical size={18} /></button>
                  {activeMenu === item.id && (
                    <div ref={menuRef} className="absolute right-12 mt-[-10px] z-50 w-36 bg-white dark:bg-[#1e293b] shadow-2xl rounded-2xl border dark:border-slate-700 p-1 ring-1 ring-black/10">
                      <button onClick={() => { setActiveMenu(null); setEditModal({ show: true, data: { ...item, usd_type: item.amount_usd >= 0 ? 'gave' : 'took', uzs_type: item.amount_uzs >= 0 ? 'gave' : 'took', amount_usd: Math.abs(item.amount_usd), amount_uzs: Math.abs(item.amount_uzs) } }); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all">
                        <Edit2 size={13} /> TAHRIRLASH
                      </button>
                      <button onClick={() => { setActiveMenu(null); setConfirmModal({ show: true, id: item.id }); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-all">
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

      {/* --- MODALLAR --- */}
      {addModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-[2.5rem] shadow-2xl border dark:border-slate-800">
            <div className="px-8 py-5 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black dark:text-white uppercase tracking-widest">Yangi Tranzaksiya</h3>
              <button onClick={() => setAddModal({ ...addModal, show: false })} className="text-slate-500"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-5">
              <input className="w-full bg-slate-50 dark:bg-slate-900 px-5 py-4 rounded-2xl outline-none dark:text-white font-bold text-sm border-2 border-transparent focus:border-indigo-500/20" value={addModal.person_name} onChange={e => setAddModal({...addModal, person_name: e.target.value})} placeholder="Ism..." />
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-800">
                  <input className="flex-1 bg-transparent px-3 outline-none dark:text-white font-black text-lg w-full" placeholder="USD 0" value={addModal.amount_usd} onChange={e => setAddModal({...addModal, amount_usd: e.target.value})} />
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
                    <button onClick={() => setAddModal({...addModal, usd_type: 'gave'})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${addModal.usd_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setAddModal({...addModal, usd_type: 'took'})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${addModal.usd_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-800">
                  <input className="flex-1 bg-transparent px-3 outline-none dark:text-white font-black text-lg w-full" placeholder="UZS 0" value={addModal.amount_uzs} onChange={e => setAddModal({...addModal, amount_uzs: e.target.value})} />
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
                    <button onClick={() => setAddModal({...addModal, uzs_type: 'gave'})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${addModal.uzs_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setAddModal({...addModal, uzs_type: 'took'})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${addModal.uzs_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
              </div>
              <button onClick={handleAdd} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-all">SAQLASH</button>
            </div>
          </div>
        </div>
      )}

      {/* TAHRIRLASH MODAL */}
      {editModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-[2.5rem] shadow-2xl border dark:border-slate-800">
            <div className="px-8 py-5 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black dark:text-white uppercase tracking-widest">Tahrirlash</h3>
              <button onClick={() => setEditModal({show:false, data:null})} className="text-slate-500"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-5">
              <input className="w-full bg-slate-50 dark:bg-slate-900 px-5 py-4 rounded-2xl outline-none dark:text-white font-bold text-sm border-2 border-transparent focus:border-indigo-500/20" value={editModal.data.person_name} onChange={e => setEditModal({...editModal, data: {...editModal.data, person_name: e.target.value}})} />
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-800">
                  <input className="flex-1 bg-transparent px-3 outline-none dark:text-white font-black text-lg w-full" value={editModal.data.amount_usd} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_usd: e.target.value}})} />
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'gave'}})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${editModal.data.usd_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, usd_type: 'took'}})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${editModal.data.usd_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-800">
                  <input className="flex-1 bg-transparent px-3 outline-none dark:text-white font-black text-lg w-full" value={editModal.data.amount_uzs} onChange={e => setEditModal({...editModal, data: {...editModal.data, amount_uzs: e.target.value}})} />
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'gave'}})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${editModal.data.uzs_type === 'gave' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>BERDIM</button>
                    <button onClick={() => setEditModal({...editModal, data: {...editModal.data, uzs_type: 'took'}})} className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${editModal.data.uzs_type === 'took' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>OLDIM</button>
                  </div>
                </div>
              </div>
              <button onClick={handleUpdate} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:opacity-90 transition-all">SAQLASH</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111827] w-full max-w-sm rounded-[2rem] p-8 text-center border dark:border-slate-800">
            <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter">O'chirilsinmi?</h3>
            <p className="text-slate-500 text-[10px] mt-2 mb-8 uppercase font-bold tracking-widest opacity-60">Amalni qaytarib bo'lmaydi</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({show:false, id:null})} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">BEKOR</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs">O'CHIRISH</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-[280px] animate-in slide-in-from-bottom-5">
           <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-rose-600 border-rose-100'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="font-bold text-[10px] uppercase tracking-widest">{notification.message}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;