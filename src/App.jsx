import React, { useState } from 'react';
import DetectionView from './components/DetectionView';
import DictionaryView from './components/DictionaryView';
import HistoryView from './components/HistoryView';
import AboutView from './components/AboutView';
import { usePwaInstall } from './utils/pwaInstall';
import { 
  Video, 
  BookOpen, 
  History, 
  Info, 
  HandMetal, 
  Download,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('detection');
  const { isInstalled, triggerInstall } = usePwaInstall();

  const navItems = [
    { id: 'detection', label: 'Kamera Deteksi', icon: Video },
    { id: 'dictionary', label: 'Kamus Isyarat', icon: BookOpen },
    { id: 'history', label: 'Riwayat Terjemahan', icon: History },
    { id: 'about', label: 'Panduan & Info', icon: Info },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <header className="h-16 w-full bg-[#121215] border-b border-zinc-800/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
            <HandMetal className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">ISYARATKU</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                1 & 2 Tangan
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Penerjemah Bahasa Isyarat SIBI & BISINDO
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-zinc-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isInstalled ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aplikasi Sudah Diinstall</span>
            </div>
          ) : (
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Aplikasi</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 flex flex-col overflow-hidden">
        {activeTab === 'detection' && (
          <DetectionView
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToDictionary={() => setActiveTab('dictionary')}
          />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView
            onSwitchToCamera={() => setActiveTab('detection')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onSwitchToCamera={() => setActiveTab('detection')}
          />
        )}

        {activeTab === 'about' && (
          <AboutView />
        )}
      </main>

      <nav className="md:hidden w-full bg-[#121215] border-t border-zinc-800 px-2 py-2 flex items-center justify-around sticky bottom-0 z-40 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
