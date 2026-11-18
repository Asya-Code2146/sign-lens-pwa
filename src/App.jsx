import React, { useState } from 'react';
import DetectionView from './components/DetectionView';
import DictionaryView from './components/DictionaryView';
import HistoryView from './components/HistoryView';
import AboutView from './components/AboutView';
import BottomNav from './components/BottomNav';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { Sparkles, Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('detection'); // 'detection' | 'dictionary' | 'history' | 'about'

  return (
    <div className="min-h-screen w-full bg-[#050811] flex items-center justify-center sm:p-4 text-slate-100 font-sans">
      {/* Background Ambience Glow for Desktop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden sm:block">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-fast" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container: Mobile-First Frame (100% Screen on Mobile, Elegant Phone Mockup on Desktop) */}
      <main className="w-full sm:max-w-md h-[100dvh] sm:h-[844px] bg-[#090d16] sm:rounded-[36px] sm:border sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative z-10">
        
        {/* Top App Header */}
        <header className="h-12 w-full bg-[#111827]/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide text-white flex items-center gap-1.5">
                ISYARATKU
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/20 uppercase">
                  PWA
                </span>
              </h1>
            </div>
          </div>

          {/* AI Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] text-cyan-300 font-medium">
            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>100% Local AI</span>
          </div>
        </header>

        {/* PWA Install Banner & Offline Notice */}
        <PwaInstallPrompt />

        {/* Active Tab Screen Content */}
        <div className="flex-1 w-full overflow-hidden relative">
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
        </div>

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />
      </main>
    </div>
  );
}
