import React, { useState } from 'react';
import DetectionView from './components/DetectionView';
import DictionaryView from './components/DictionaryView';
import HistoryView from './components/HistoryView';
import AboutView from './components/AboutView';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { 
  Video, 
  BookOpen, 
  History, 
  Info, 
  HandMetal, 
  Sparkles,
  Wifi,
  Download
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('detection'); // 'detection' | 'dictionary' | 'history' | 'about'

  const navItems = [
    { id: 'detection', label: 'Kamera Deteksi', icon: Video },
    { id: 'dictionary', label: 'Kamus Isyarat', icon: BookOpen },
    { id: 'history', label: 'Riwayat Terjemahan', icon: History },
    { id: 'about', label: 'Panduan & Info', icon: Info },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Professional Navigation Bar (Desktop & Mobile) */}
      <header className="h-16 w-full bg-[#111827]/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <HandMetal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ISYARATKU</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Client-Side AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Penerjemah Bahasa Isyarat Real-Time Tanpa API Key Eksternal
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status & PWA Install Notice */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MediaPipe 21 Landmarks</span>
          </div>
        </div>
      </header>

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Main App Content Area (Full Width & Responsive) */}
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

      {/* Mobile Bottom Navigation Bar (Visible only on Mobile Screens) */}
      <nav className="md:hidden w-full bg-[#111827]/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 flex items-center justify-around sticky bottom-0 z-40 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
