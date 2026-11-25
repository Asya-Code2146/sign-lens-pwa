import React from 'react';
import { Camera, BookOpen, Clock, Sliders } from 'lucide-react';

export default function BottomNav({ activeTab, onChangeTab }) {
  const navItems = [
    { id: 'detection', label: 'Terjemah', icon: Camera },
    { id: 'dictionary', label: 'Kamus', icon: BookOpen },
    { id: 'history', label: 'Riwayat', icon: Clock },
    { id: 'about', label: 'Atur', icon: Sliders },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-4 py-2 flex items-center justify-around z-40 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 transition ${
              isActive ? 'text-[#c84b1a] font-bold' : 'text-stone-400'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
