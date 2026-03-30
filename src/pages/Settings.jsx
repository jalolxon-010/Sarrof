import React, { useState, useEffect } from 'react';
import API from '../api/api'; // O'zingiz yaratgan API instance-ni import qiling
import { DollarSign, Save, Edit3, RefreshCcw } from 'lucide-react';

const Setting = () => {
    const [rate, setRate] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 1. Kursni bazadan yuklab olish
    const fetchRate = async () => {
        setLoading(true);
        try {
            // baseURL ichida /api bor, shuning uchun faqat davomini yozamiz
            const res = await API.get('/settings/usd-rate'); 
            setRate(res.data.rate);
        } catch (err) {
            setMessage({ type: 'error', text: 'Kursni yuklab bo\'lmadi' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRate();
    }, []);

    // 2. Kursni yangilash
    const handleUpdate = async () => {
        if(!rate || rate <= 0) {
            setMessage({ type: 'error', text: 'To\'g\'ri qiymat kiriting' });
            return;
        }
        setLoading(true);
        try {
            // Bu yerda ham faqat endpoint nomi
            await API.post('/settings/usd-rate', { rate: rate });
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Muvaffaqiyatli saqlandi!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Saqlashda xatolik yuz berdi' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // ... (qolgan JSX kodlari o'sha-o'sha)

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <RefreshCcw className="text-indigo-600" /> Tizim Sozlamalari
            </h2>

            <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <DollarSign size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[2px] mb-1">
                                AQSH Dollari Kursi (1$)
                            </p>
                            {isEditing ? (
                                <input 
                                    type="number"
                                    value={rate}
                                    onChange={(e) => setRate(e.target.value)}
                                    className="text-2xl font-black text-indigo-600 border-b-4 border-indigo-500 outline-none w-40 bg-transparent"
                                    autoFocus
                                />
                            ) : (
                                <h3 className="text-3xl font-black text-slate-800">
                                    {Number(rate).toLocaleString()} <span className="text-sm font-medium text-slate-400">UZS</span>
                                </h3>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {isEditing ? (
                            <button 
                                onClick={handleUpdate}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                <Save size={18} /> {loading ? "Saqlanmoqda..." : "SAQLASH"}
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                <Edit3 size={18} /> O'ZGARTIRISH
                            </button>
                        )}
                    </div>
                </div>

                {/* Xabarnoma (Status Message) */}
                {message.text && (
                    <div className={`mt-6 p-4 rounded-xl text-center font-bold text-sm ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="mt-8 text-slate-400 text-sm text-center">
                * Bu yerda kiritilgan kurs barcha qarz va hisob-kitoblarga ta'sir qiladi.
            </div>
        </div>
    );
};

export default Setting;