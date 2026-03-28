import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertTriangle } from 'lucide-react';
import API from '../api/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Backend-ga login so'rovini yuboramiz
// Agar avval '/auth/login' bo'lsa, endi faqat '/login' qiling
const res = await API.post('/login', { username, password });

      if (res.data.token) {
        // Muvaffaqiyatli kirish: Token va holatni saqlaymiz
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = '/'; 
      }
    } catch (err) {
      // Xato bo'lsa (parol noto'g'ri yoki server o'chiq)
      setError(err.response?.data?.message || 'Login yoki parol xato yoki server bilan aloqa yo\'q!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-[#1e293b] w-full max-w-md p-8 md:p-10 rounded-3xl border border-slate-700 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500 rounded-3xl text-black font-black text-3xl mb-5 shadow-xl shadow-amber-500/20">
            $
          </div>
          <h1 className="text-3xl font-extrabold text-white">Tizimga Kirish</h1>
          <p className="text-slate-400 mt-2 text-sm">Faqat ruxsat etilgan foydalanuvchilar uchun</p>
        </div>

        {error && (
          <div className="bg-rose-600/10 border border-rose-600 text-rose-500 p-4 rounded-xl text-sm mb-6 flex items-center gap-3 animate-pulse">
            <AlertTriangle size={24} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Foydalanuvchi nomi</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="sarrof..."
                required
                className="w-full bg-[#0f172a] border border-slate-600 p-4 pl-12 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0f172a] border border-slate-600 p-4 pl-12 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <LogIn size={22} /> Tizimga Kirish
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-600">
          SarrofPro v1.0 | Barcha huquqlar himoyalangan
        </div>
      </div>
    </div>
  );
};

export default Login;