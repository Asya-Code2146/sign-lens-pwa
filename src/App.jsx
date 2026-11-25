import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import DetectionView from './components/DetectionView';
import DictionaryView from './components/DictionaryView';
import HistoryView from './components/HistoryView';
import AboutView from './components/AboutView';
import { usePwaInstall } from './utils/pwaInstall';
import { 
  Camera, 
  BookOpen, 
  Clock, 
  Sliders, 
  Download,
  CheckCircle2,
  Home
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [signSystem, setSignSystem] = useState('SIBI');
  const { isInstalled, triggerInstall } = usePwaInstall();

  return (
    <div className="min-h-screen w-full bg-[#fbf9f5] text-stone-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-950">
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="font-extrabold text-2xl tracking-tight text-stone-900">
            Isyarat
          </span>
        </div>

        {activeTab === 'landing' ? (
          <div className="flex items-center gap-2 sm:gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-stone-600">
              <button 
                onClick={() => setActiveTab('about')}
                className="hover:text-stone-900 transition"
              >
                Fitur
              </button>
              <button 
                onClick={() => setActiveTab('dictionary')}
                className="hover:text-stone-900 transition"
              >
                Kamus
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className="hover:text-stone-900 transition"
              >
                Cara kerja
              </button>
            </nav>

            <button
              onClick={() => setActiveTab('detection')}
              className="px-5 py-2.5 rounded-full bg-[#c84b1a] hover:bg-[#b53f12] text-white text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
            >
              Buka aplikasi
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-[#ede8e1]/60 p-1 rounded-full border border-[#e5dfd7]">
              <button
                onClick={() => setSignSystem('SIBI')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  signSystem === 'SIBI'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                SIBI
              </button>
              <button
                onClick={() => setSignSystem('BISINDO')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  signSystem === 'BISINDO'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                BISINDO
              </button>
            </div>

            <button
              onClick={() => setActiveTab('dictionary')}
              className={`hidden sm:block px-4 py-2 rounded-full text-xs font-semibold border transition ${
                activeTab === 'dictionary'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              Kamus
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`hidden sm:block px-4 py-2 rounded-full text-xs font-semibold border transition ${
                activeTab === 'history'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              Riwayat
            </button>

            <button
              onClick={() => setActiveTab('landing')}
              className="hidden sm:block px-4 py-2 rounded-full text-xs font-semibold bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition"
            >
              Beranda
            </button>

            <div className="sm:hidden flex items-center gap-1.5">
              <button
                onClick={() => setSignSystem(prev => prev === 'SIBI' ? 'BISINDO' : 'SIBI')}
                className="px-3 py-1 rounded-full bg-white border border-stone-300 text-xs font-bold text-stone-800 shadow-sm"
              >
                {signSystem}
              </button>
            </div>

            {isInstalled ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terpasang</span>
              </div>
            ) : (
              <button
                onClick={triggerInstall}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c84b1a] hover:bg-[#b53f12] text-white text-xs font-semibold transition shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-20 sm:pb-8 flex flex-col">
        {activeTab === 'landing' && (
          <LandingPage
            onOpenApp={() => setActiveTab('detection')}
            onOpenDictionary={() => setActiveTab('dictionary')}
          />
        )}

        {activeTab === 'detection' && (
          <DetectionView
            signSystem={signSystem}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToDictionary={() => setActiveTab('dictionary')}
          />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView
            signSystem={signSystem}
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

      {activeTab !== 'landing' && (
        <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-4 py-2 flex items-center justify-around z-40 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={() => setActiveTab('detection')}
            className={`flex flex-col items-center justify-center py-1 px-3 transition ${
              activeTab === 'detection' ? 'text-[#c84b1a] font-bold' : 'text-stone-400'
            }`}
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Terjemah</span>
          </button>

          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex flex-col items-center justify-center py-1 px-3 transition ${
              activeTab === 'dictionary' ? 'text-[#c84b1a] font-bold' : 'text-stone-400'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Kamus</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1 px-3 transition ${
              activeTab === 'history' ? 'text-[#c84b1a] font-bold' : 'text-stone-400'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Riwayat</span>
          </button>

          <button
            onClick={() => setActiveTab('landing')}
            className="flex flex-col items-center justify-center py-1 px-3 text-stone-400 hover:text-stone-900 transition"
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Beranda</span>
          </button>
        </nav>
      )}
    </div>
  );
}
