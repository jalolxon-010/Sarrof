import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { PlusCircle, Wallet, DollarSign, CheckCircle2, AlertCircle, X } from 'lucide-react';

const Dashboard = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ person_name: '', amount_usd: '', amount_uzs: '', type: 'gave' });
  const [kurs, setKurs] = useState(0);
  
  // Modal uchun statelar
  const [modal, setModal] = useState({ show: false, type: '', title: '', message: '' });

  useEffect(() => { 
    fetchAll(); 
    fetchKurs(); 
  }, []);

  const fetchAll = async () => { 
    try { 
      const res = await API.get('/transactions'); 
      setList(res.data); 
    } catch (e) {
      console.error("Ma'lumot olishda xato:", e);
    } 
  };

  const fetchKurs = async () => {
    try {
      const res = await API.get('/settings/usd-rate');
      setKurs(parseFloat(res.data.rate));
    } catch (e) {
      console.error("Kursni olishda xato:", e);
    }
  };

  const showNotification = (type, title, message) => {
    setModal({ show: true, type, title, message });
    if (type === 'success') {
      setTimeout(() => setModal({ ...modal, show: false }), 3000);
    }
  };

  const handleSave = async () => {
    // 1. Ism tekshiruvi
    if(!form.person_name.trim()) {
        return showNotification('error', 'Xatolik', 'Iltimos, ismni kiriting');
    }

    // 2. Kamida bitta maydon to'ldirilgan bo'lishi kerak mantiqi
    const usd = parseFloat(form.amount_usd) || 0;
    const uzs = parseFloat(form.amount_uzs) || 0;

    if (usd <= 0 && uzs <= 0) {
        return showNotification('error', 'Xatolik', 'Kamida bitta maydonga (USD yoki UZS) miqdor kiriting');
    }

    try {
      // Backendga yuboriladigan ma'lumotni tozalash
      const dataToSave = {
        person_name: form.person_name,
        type: form.type,
        amount_usd: usd,
        amount_uzs: uzs
      };

      await API.post('/transactions/add', dataToSave);
      
      setForm({ person_name: '', amount_usd: '', amount_uzs: '', type: 'gave' });
      fetchAll();
      showNotification('success', 'Tayyor!', 'Ma’lumot muvaffaqiyatli saqlandi');
    } catch (error) {
      console.error("Saqlashda xato:", error);
      showNotification('error', 'Xatolik', 'Server bilan bog‘lanishda xatolik yuz berdi');
    }
  };

  const totals = list.reduce((acc, curr) => {
    const usd = parseFloat(curr.amount_usd) || 0;
    const uzs = parseFloat(curr.amount_uzs) || 0;
    curr.type === 'gave' ? (acc.usd += usd, acc.uzs += uzs) : (acc.usd -= usd, acc.uzs -= uzs);
    return acc;
  }, { usd: 0, uzs: 0 });

  const format = (n) => new Intl.NumberFormat().format(n);

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      
      {/* --- CUSTOM MODAL --- */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
            <button onClick={() => setModal({...modal, show: false})} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={20}/></button>
            
            <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              {modal.type === 'success' ? <CheckCircle2 size={44} /> : <AlertCircle size={44} />}
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{modal.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">{modal.message}</p>
            
            <button 
              onClick={() => setModal({...modal, show: false})}
              className={`w-full py-4 rounded-2xl font-bold tracking-wide transition-all ${modal.type === 'success' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Asosiy Panel</h1>
        <div className="text-[10px] md:text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-500/30 tracking-tighter">
          KURS: 1$ = {format(kurs)} UZS
        </div>
      </div>

      {/* --- CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">USD Balans</p>
          <h2 className={`text-3xl font-black mt-2 ${totals.usd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totals.usd >= 0 ? '+' : ''}{format(totals.usd)} $
          </h2>
          <DollarSign className="absolute -right-4 -bottom-4 text-slate-50 dark:text-slate-700/20" size={120} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">UZS Balans</p>
          <h2 className={`text-3xl font-black mt-2 ${totals.uzs >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totals.uzs >= 0 ? '+' : ''}{format(totals.uzs)}
          </h2>
        </div>

        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Umumiy (So'mda)</p>
          <h2 className="text-3xl font-black mt-2 tracking-tighter">{format((totals.uzs + totals.usd * kurs).toFixed(0))}</h2>
          <div className="absolute top-0 right-0 p-4 opacity-20"><Wallet size={40} /></div>
        </div>
      </div>

      {/* --- FORM --- */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl">
        <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
          <PlusCircle className="text-indigo-600 dark:text-indigo-400" size={20} /> Yangi operatsiya
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Ism</label>
            <input 
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white p-4 rounded-2xl outline-none border border-transparent focus:border-indigo-500 transition-all font-medium" 
              value={form.person_name} 
              onChange={e => setForm({...form, person_name: e.target.value})} 
              placeholder="Foydalanuvchi ismi"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">Turi</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white p-4 rounded-2xl border border-transparent outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer" 
              value={form.type} 
              onChange={e => setForm({...form, type: e.target.value})}
            >
              <option value="gave">Berdim (+)</option>
              <option value="took">Oldim (-)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">USD</label>
            <input 
              type="number" 
              placeholder="0"
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white p-4 rounded-2xl border border-transparent focus:border-indigo-500 font-medium" 
              value={form.amount_usd} 
              onChange={e => setForm({...form, amount_usd: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest">UZS</label>
            <input 
              type="number" 
              placeholder="0"
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white p-4 rounded-2xl border border-transparent focus:border-indigo-500 font-medium" 
              value={form.amount_uzs} 
              onChange={e => setForm({...form, amount_uzs: e.target.value})} 
            />
          </div>
        </div>
        <button 
          onClick={handleSave} 
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black tracking-[3px] transition-all shadow-lg shadow-indigo-200 dark:shadow-none uppercase"
        >
          Ma'lumotni saqlash
        </button>
      </div>
    </div>
  );
};

export default Dashboard;