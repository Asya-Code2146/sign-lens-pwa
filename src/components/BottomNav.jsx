import React from 'react';
import { Camera, BookOpen, Clock, Info } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export default function BottomNav({ activeTab, onChangeTab }) {
  const navItems = [
    { id: 'detection', label: 'Deteksi', icon: Camera },
    { id: 'dictionary', label: 'Kamus', icon: BookOpen },
    { id: 'history', label: 'Riwayat', icon: Clock },
    { id: 'about', label: 'Tentang', icon: Info },
  ];

  const handleTabClick = (tabId) => {
    soundFX.playTap();
    onChangeTab(tabId);
  };

  return (
    <nav className="w-full bg-[#111827]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 z-40 flex-shrink-0 select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Pill Background Indicator */}
              {isActive && (
                <span className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl -z-10 animate-in fade-in zoom-in-90 duration-200" />
              )}

              {/* Icon dengan Glow saat aktif */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''
                  }`}
                />
              </div>

              {/* Label Navigasi */}
              <span
                className={`text-[10px] mt-1 font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
