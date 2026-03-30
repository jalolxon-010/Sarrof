import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { PlusCircle, DollarSign, CheckCircle2, AlertCircle, X, ArrowUpRight, ArrowDownLeft, Coins, User } from 'lucide-react';

const Dashboard = () => {
  const [list, setList] = useState([]);
  const [kurs, setKurs] = useState(0);
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

  const handleSave = async () => {
    if(!form.person_name.trim()) return showNotification('error', 'Xato', 'Ismni kiriting');
    const usd = parseFloat(form.amount_usd) || 0;
    const uzs = parseFloat(form.amount_uzs) || 0;
    if (usd === 0 && uzs === 0) return showNotification('error', 'Xato', 'Miqdor kiriting');

    try {
      const dataToSave = {
        person_name: form.person_name,
        amount_usd: form.usd_type === 'took' ? -Math.abs(usd) : Math.abs(usd),
        amount_uzs: form.uzs_type === 'took' ? -Math.abs(uzs) : Math.abs(uzs),
        type: usd > 0 ? form.usd_type : form.uzs_type,
        date: new Date().toISOString()
      };
      await API.post('/transactions/add', dataToSave);
      setForm({ person_name: '', amount_usd: '', usd_type: 'gave', amount_uzs: '', uzs_type: 'gave' });
      fetchAll();
      showNotification('success', 'Saqlandi', 'Ma’lumot muvaffaqiyatli qo‘shildi');
    } catch (error) {
      showNotification('error', 'Xatolik', 'Serverda xato yuz berdi (500)');
    }
  };

  const totals = list.reduce((acc, curr) => {
    acc.usd += (parseFloat(curr.amount_usd) || 0);
    acc.uzs += (parseFloat(curr.amount_uzs) || 0);
    return acc;
  }, { usd: 0, uzs: 0 });

  const format = (n) => new Intl.NumberFormat().format(n);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Modal Notification */}
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

      {/* Header & Stats Card (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">USD Balans</p>
          <h2 className={`text-2xl md:text-3xl font-black mt-2 ${totals.usd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{format(totals.usd)} $</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UZS Balans</p>
          <h2 className={`text-2xl md:text-3xl font-black mt-2 ${totals.uzs >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{format(totals.uzs)}</h2>
        </div>
        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Kurs: 1$ = {format(kurs)} UZS</p>
          <h2 className="text-2xl md:text-3xl font-black mt-2">{format((totals.uzs + totals.usd * kurs).toFixed(0))} <span className="text-sm opacity-60">UMUMIY</span></h2>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl"><PlusCircle size={24}/></div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white">Yangi operatsiya</h3>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Ism kiritish */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 mb-2 block">Kim bilan? (Ism)</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input className="w-full bg-slate-50 dark:bg-slate-900 pl-14 pr-6 py-5 rounded-[1.5rem] outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:text-white transition-all text-lg font-bold" value={form.person_name} onChange={e => setForm({...form, person_name: e.target.value})} placeholder="Masalan: Jasurbek" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* USD Card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">Dollar operatsiyasi</span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${form.usd_type === 'gave' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {form.usd_type === 'gave' ? 'BERDIM (+)' : 'OLDIM (-)'}
                </span>
              </div>
              <div className="flex gap-3">
                <input type="number" className="flex-1 bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl outline-none dark:text-white text-xl font-black" value={form.amount_usd} onChange={e => setForm({...form, amount_usd: e.target.value})} placeholder="0.00" />
                <button onClick={() => setForm({...form, usd_type: form.usd_type === 'gave' ? 'took' : 'gave'})} className={`p-4 rounded-2xl transition-all shadow-sm ${form.usd_type === 'gave' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {form.usd_type === 'gave' ? <ArrowUpRight size={24}/> : <ArrowDownLeft size={24}/>}
                </button>
              </div>
            </div>

            {/* UZS Card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border-2 border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">So'm operatsiyasi</span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${form.uzs_type === 'gave' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {form.uzs_type === 'gave' ? 'BERDIM (+)' : 'OLDIM (-)'}
                </span>
              </div>
              <div className="flex gap-3">
                <input type="number" className="flex-1 bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl outline-none dark:text-white text-xl font-black" value={form.amount_uzs} onChange={e => setForm({...form, amount_uzs: e.target.value})} placeholder="0" />
                <button onClick={() => setForm({...form, uzs_type: form.uzs_type === 'gave' ? 'took' : 'gave'})} className={`p-4 rounded-2xl transition-all shadow-sm ${form.uzs_type === 'gave' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {form.uzs_type === 'gave' ? <ArrowUpRight size={24}/> : <ArrowDownLeft size={24}/>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="mt-10 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-[1.5rem] text-lg font-black tracking-[0.2em] transition-all shadow-xl shadow-indigo-200 dark:shadow-none uppercase">Ma'lumotni saqlash</button>
      </div>
    </div>
  );
};

export default Dashboard;