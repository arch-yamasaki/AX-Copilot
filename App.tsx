import React, { useState, useCallback, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { Carte } from './types';
import ChatView from './components/ChatView';
import DashboardView from './components/DashboardView';
import { LogoIcon } from './components/icons/LogoIcon';
import HomeView from './components/HomeView';
import Flash from './components/Flash';
import { observeAuth, signInWithGoogle, signOutApp } from './services/authService';
import { listCartes, addCarte as addCarteRepo, deleteCarte as deleteCarteRepo } from './services/carteRepository';
import app from './services/firebaseClient';
import { setAIApp } from './services/aiLogic';
import { getUserProfile, setUserProfile } from './services/userRepository';
import ProfileSetupDialog from './components/ProfileSetupDialog';

// Initialize AI service with the browser-specific Firebase app instance
setAIApp(app);

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
  const [needsProfile, setNeedsProfile] = useState<boolean>(false);

  const showFlash = useCallback((msg: string, type: 'info'|'success'|'error' = 'info') => {
    setFlash({ msg, type });
  }, []);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 認証状態を監視し、ログイン済みならプロフィールを確認してからカルテを読み込む
    const unsub = observeAuth(async (u) => {
      setIsLoading(true);
      try {
        setUser(u);
        if (u) {
          const profile = await getUserProfile(u.uid);
          if (!profile) {
            setNeedsProfile(true);
            setCartes([]);
            setView('chat');
          } else {
            const fetched = await listCartes(u.uid);
            setCartes(fetched);
            setView(fetched.length > 0 ? 'dashboard' : 'chat');
          }
        } else {
          setNeedsProfile(false);
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

  const handleDeleteCarte = useCallback(async (workId: string) => {
    if (!user) return;
    if (window.confirm('このカルテを削除します。よろしいですか？')) {
      try {
        await deleteCarteRepo(user.uid, workId);
        setCartes(prev => prev.filter(c => c.workId !== workId));
        if (currentCarteId === workId) setCurrentCarteId(null);
      } catch (e) {
        console.error('Failed to delete carte', e);
      }
    }
  }, [user, currentCarteId]);

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
            {view === 'dashboard' && <DashboardView cartes={cartes} onStartNew={handleStartNew} onDeleteCarte={handleDeleteCarte} highlightId={currentCarteId} />}
          </>
        )}
      </main>
      {needsProfile && user && (
        <ProfileSetupDialog
          user={user}
          defaultFullname={user.displayName || undefined}
          onSave={async (fullname, department) => {
            try {
              await setUserProfile(user.uid, { fullname, department, email: user.email || '' });
              setNeedsProfile(false);
              showFlash('プロフィールを保存しました', 'success');
              const fetched = await listCartes(user.uid);
              setCartes(fetched);
              setView(fetched.length > 0 ? 'dashboard' : 'chat');
            } catch (e) {
              console.error(e);
              showFlash('プロフィールの保存に失敗しました', 'error');
              throw e;
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
