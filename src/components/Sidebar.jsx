import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TableProperties, Settings, LogOut, Sun, Moon, Wallet } from 'lucide-react';

const Sidebar = ({ onLogout, darkMode, setDarkMode }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Amallar ro\'yxati', path: '/transactions', icon: TableProperties },
    { name: 'Sozlamalar', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none font-bold italic">$</div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              Sarrof<span className="text-indigo-600">Pro</span>
            </h1>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-amber-400 hover:ring-2 ring-indigo-500/20 transition-all"
          >
            {darkMode ? <Sun size={18} fill="currentColor" /> : <Moon size={18} fill="currentColor" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
              `}
            >
              <item.icon size={19} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 py-3 rounded-xl font-bold text-xs transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
          >
            <LogOut size={16} /> TIZIMDAN CHIQISH
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-2 px-6 flex justify-around items-center shadow-2xl">
        {menuItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex flex-col items-center gap-1 p-2 text-[10px] font-bold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
        <button onClick={() => setDarkMode(!darkMode)} className="flex flex-col items-center gap-1 p-2 text-slate-400 dark:text-amber-400">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[9px]">{darkMode ? 'Kungi' : 'Tungi'}</span>
        </button>
      </div>
    </>
  );
};

export default Sidebar;