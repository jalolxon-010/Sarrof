import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { PlusCircle, Wallet, DollarSign, CheckCircle2, AlertCircle, X, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [list, setList] = useState([]);
  const [kurs, setKurs] = useState(0);
  const [loading, setLoading] = useState(false); // Tugmani bloklash uchun
  const [form, setForm] = useState({ 
    person_name: '', 
    amount_usd: '', 
    usd_type: 'gave', 
    amount_uzs: '', 
    uzs_type: 'gave' 
  });
  const [modal, setModal] = useState({ show: false, type: '', title: '', message: '' });

  useEffect(() => { 
    fetchAll(); 
    fetchKurs(); 
  }, []);

  const fetchAll = async () => { 
    try { 
      const res = await API.get('/transactions'); 
      setList(res.data || []); 
    } catch (e) { console.error(e); } 
  };

  const fetchKurs = async () => {
    try {
      const res = await API.get('/settings/usd-rate');
      setKurs(parseFloat(res.data.rate));
    } catch (e) { console.error(e); }
  };

  const showNotification = (type, title, message) => {
    setModal({ show: true, type, title, message });
    if (type === 'success') setTimeout(() => setModal(prev => ({ ...prev, show: false })), 2500);
  };

  const calculateInput = (value) => {
    try {
      if (/[+\-*/]/.test(value)) {
        const result = new Function(`return ${value.replace(/[^-()\d/*+.]/g, '')}`)();
        return result.toString();
      }
      return value;
    } catch (e) { return value; }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      const result = calculateInput(e.target.value);
      setForm({ ...form, [field]: result });
    }
  };

  const handleSave = async () => {
    // 1. Agar allaqachon yuklanayotgan bo'lsa, funksiyani to'xtatish
    if (loading) return; 

    if(!form.person_name.trim()) return showNotification('error', 'Xato', 'Ismni kiriting');
    
    const usdVal = calculateInput(form.amount_usd.toString());
    const uzsVal = calculateInput(form.amount_uzs.toString());
    const usd = parseFloat(usdVal) || 0;
    const uzs = parseFloat(uzsVal) || 0;

    if (usd === 0 && uzs === 0) return showNotification('error', 'Xato', 'Miqdor kiriting');

    try {
      setLoading(true); // 2. Yuklashni boshlash (Tugma bloklanadi)

      const mainType = usd > 0 ? form.usd_type : form.uzs_type;
      const dataToSave = {
        person_name: form.person_name,
        amount_usd: form.usd_type === 'took' ? -Math.abs(usd) : Math.abs(usd),
        amount_uzs: form.uzs_type === 'took' ? -Math.abs(uzs) : Math.abs(uzs),
        type: mainType, 
        date: new Date().toISOString()
      };

      await API.post('/transactions/add', dataToSave);
      
      setForm({ person_name: '', amount_usd: '', usd_type: 'gave', amount_uzs: '', uzs_type: 'gave' });
      await fetchAll();
      showNotification('success', 'Saqlandi', 'Ma’lumot muvaffaqiyatli qo‘shildi');
    } catch (error) {
      console.error("Saqlashda xato:", error.response?.data || error.message);
      showNotification('error', 'Server Xatosi', 'Backend ma’lumotni qabul qilmadi');
    } finally {
      setLoading(false); // 3. Har qanday holatda (xato bo'lsa ham) blokdan yechish
    }
  };

  const totals = list.reduce((acc, curr) => {
    acc.usd += (parseFloat(curr.amount_usd) || 0);
    acc.uzs += (parseFloat(curr.amount_uzs) || 0);
    return acc;
  }, { usd: 0, uzs: 0 });

  const format = (n) => new Intl.NumberFormat().format(n);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
              {modal.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">{modal.title}</h3>
            <p className="text-slate-500 text-sm mb-6">{modal.message}</p>
            <button onClick={() => setModal({...modal, show: false})} className="w-full py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold dark:text-white">Yopish</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Asosiy Panel</h1>
        <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold">
          1$ = {format(kurs)} UZS
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">USD Balans</p>
          <h2 className={`text-3xl font-black mt-2 ${totals.usd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{format(totals.usd)} $</h2>
          <DollarSign className="absolute -right-4 -bottom-4 text-slate-50 dark:text-slate-700/10" size={120} />
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UZS Balans</p>
          <h2 className={`text-3xl font-black mt-2 ${totals.uzs >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{format(totals.uzs)}</h2>
          <Wallet className="absolute -right-4 -bottom-4 text-slate-50 dark:text-slate-700/10" size={100} />
        </div>
        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Umumiy Balans ($ da)</p>
          <h2 className="text-3xl font-black mt-2">
            {format((totals.usd + (totals.uzs / (kurs || 1))).toFixed(2))} $
          </h2>
          <DollarSign className="absolute -right-4 -bottom-4 opacity-10" size={120} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl">
        <h3 className="font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2"><PlusCircle size={20}/> Yangi operatsiya</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Shaxs ismi</label>
            <input className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl outline-none border border-transparent focus:border-indigo-500 dark:text-white" value={form.person_name} onChange={e => setForm({...form, person_name: e.target.value})} placeholder="Ism kiriting" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 flex justify-between">USD ($) 
              <span className={form.usd_type === 'gave' ? 'text-emerald-500' : 'text-rose-500'}>{form.usd_type === 'gave' ? 'Berdim (+)' : 'Oldim (-)'}</span>
            </label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl outline-none border border-transparent focus:border-indigo-500 dark:text-white" value={form.amount_usd} onChange={e => setForm({...form, amount_usd: e.target.value})} onKeyDown={(e) => handleKeyDown(e, 'amount_usd')} placeholder="0" />
              <button onClick={() => setForm({...form, usd_type: form.usd_type === 'gave' ? 'took' : 'gave'})} className={`p-4 rounded-2xl transition-all ${form.usd_type === 'gave' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {form.usd_type === 'gave' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 flex justify-between">UZS (So'm)
              <span className={form.uzs_type === 'gave' ? 'text-emerald-500' : 'text-rose-500'}>{form.uzs_type === 'gave' ? 'Berdim (+)' : 'Oldim (-)'}</span>
            </label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl outline-none border border-transparent focus:border-indigo-500 dark:text-white" value={form.amount_uzs} onChange={e => setForm({...form, amount_uzs: e.target.value})} onKeyDown={(e) => handleKeyDown(e, 'amount_uzs')} placeholder="0" />
              <button onClick={() => setForm({...form, uzs_type: form.uzs_type === 'gave' ? 'took' : 'gave'})} className={`p-4 rounded-2xl transition-all ${form.uzs_type === 'gave' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {form.uzs_type === 'gave' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
              </button>
            </div>
          </div>
        </div>
        
        {/* TUGMA O'ZGARTIRILDI: disabled xossasi qo'shildi */}
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className={`mt-8 w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black tracking-widest transition-all uppercase ${loading ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Saqlanmoqda...
            </>
          ) : (
            "Ma'lumotni saqlash"
          )}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;