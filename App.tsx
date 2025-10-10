import React, { useState, useCallback, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { Carte } from './types';
import ChatView from './components/ChatView';
import DashboardView from './components/DashboardView';
import { LogoIcon } from './components/icons/LogoIcon';
import HomeView from './components/HomeView';
import Flash from './components/Flash';
import { observeAuth, signInWithGoogle, signOutApp } from './services/authService';
import { listCartes, addCarte as addCarteRepo, deleteAllCartes as deleteAllCartesRepo } from './services/carteRepository';

type View = 'chat' | 'dashboard';

// --- Firebase-backed Service Layer ---
// Firestoreに置き換えた実装。可読性のため薄いラップのみ。

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <LogoIcon className="h-16 w-16 text-blue-600 animate-pulse" />
    <p className="text-gray-600 mt-4">AX Copilotを起動しています...</p>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('chat');
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentCarteId, setCurrentCarteId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ msg: string; type: 'info'|'success'|'error' } | null>(null);

  const showFlash = useCallback((msg: string, type: 'info'|'success'|'error' = 'info') => {
    setFlash({ msg, type });
  }, []);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 認証状態を監視し、ログイン済みならFirestoreからカルテを読み込む
    const unsub = observeAuth(async (u) => {
      setIsLoading(true);
      try {
        setUser(u);
        if (u) {
          const fetched = await listCartes(u.uid);
          setCartes(fetched);
          setView(fetched.length > 0 ? 'dashboard' : 'chat');
        } else {
          setCartes([]);
          setView('chat');
        }
      } catch (e) {
        console.error('Failed to load data', e);
        setView('chat');
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleCarteGenerated = useCallback(async (newCarte: Carte) => {
    if (!user) return;
    try {
      await addCarteRepo(user.uid, newCarte);
      setCartes(prev => [...prev, newCarte]);
      setCurrentCarteId(newCarte.workId);
      setView('dashboard');
    } catch (e) {
      console.error('Failed to add carte', e);
    }
  }, [user]);
  
  const handleStartNew = useCallback(() => {
    setView('chat');
  }, []);

  const handleClearData = useCallback(async () => {
    if (!user) return;
    if (window.confirm('本当にすべての業務カルテを削除しますか？この操作は元に戻せません。')) {
      try {
        await deleteAllCartesRepo(user.uid);
        setCartes([]);
        setView('chat');
      } catch (e) {
        console.error('Failed to clear data', e);
      }
    }
  }, [user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView(cartes.length > 0 ? 'dashboard' : 'chat')}>
            <LogoIcon className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold tracking-wider text-gray-900">AX Copilot</span>
          </div>
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <button 
                  onClick={() => setView('chat')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${view === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                >
                  業務棚卸しボット
                </button>
                <button 
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                  disabled={cartes.length === 0}
                >
                  カルテダッシュボード
                </button>
              </>
            )}
            {user && (
              <button
                onClick={() => signOutApp().then(() => showFlash('ログアウトしました', 'info')).catch(err => console.error(err))}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                ログアウト
              </button>
            )}
          </div>
        </nav>
      </header>

      {flash && (
        <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none">
          <div className="flex justify-center">
            <div className="pointer-events-auto">
              <Flash message={flash.msg} type={flash.type} onClose={() => setFlash(null)} />
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow pt-20">
        {!user ? (
          <HomeView onFlash={showFlash} />
        ) : (
          <>
            {view === 'chat' && <ChatView key={Date.now()} onCarteGenerated={handleCarteGenerated} />}
            {view === 'dashboard' && <DashboardView cartes={cartes} onStartNew={handleStartNew} onClearData={handleClearData} highlightId={currentCarteId} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
