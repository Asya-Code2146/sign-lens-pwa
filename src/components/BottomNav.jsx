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
    <nav className="w-full bg-[#121215] border-t border-zinc-800 px-2 py-1.5 z-40 flex-shrink-0 select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-zinc-800 rounded-xl -z-10" />
              )}
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-emerald-400' : ''
                }`}
              />
              <span
                className={`text-[10px] mt-1 font-medium ${
                  isActive ? 'text-white font-semibold' : 'text-zinc-400'
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
