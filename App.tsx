import React, { useState, useCallback, useEffect } from 'react';
import { Carte } from './types';
import ChatView from './components/ChatView';
import DashboardView from './components/DashboardView';
import { LogoIcon } from './components/icons/LogoIcon';

type View = 'chat' | 'dashboard';

// --- Service Layer Simulation ---
// This section simulates an async API service for managing cartes.
// It currently uses localStorage but can be easily swapped for a real backend API.

const STORAGE_KEY = 'ax_copilot_cartes';

const fakeApiCall = <T,>(data: T, delay = 100): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), delay));

const fetchCartesFromStorage = async (): Promise<Carte[]> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const cartes = saved ? JSON.parse(saved) : [];
    return fakeApiCall(cartes);
  } catch (e) {
    console.error("Failed to load cartes:", e);
    return fakeApiCall([]);
  }
};

const saveCartesToStorage = async (cartes: Carte[]): Promise<Carte[]> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartes));
    return fakeApiCall(cartes);
  } catch (e) {
    console.error("Failed to save cartes:", e);
    throw new Error("Could not save cartes.");
  }
};

const clearCartesInStorage = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    await fakeApiCall(undefined);
  } catch (e) {
    console.error("Failed to clear cartes:", e);
    throw new Error("Could not clear cartes.");
  }
};
// --- End of Service Layer Simulation ---

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

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const fetchedCartes = await fetchCartesFromStorage();
        setCartes(fetchedCartes);
        if (fetchedCartes.length > 0) {
          setView('dashboard');
        } else {
          setView('chat');
        }
      } catch (e) {
        console.error("Failed to fetch cartes", e);
        setView('chat'); // Fallback to chat view on error
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleCarteGenerated = useCallback(async (newCarte: Carte) => {
    try {
      const currentCartes = await fetchCartesFromStorage();
      const updatedCartes = [...currentCartes, newCarte];
      await saveCartesToStorage(updatedCartes);
      setCartes(updatedCartes);
      setCurrentCarteId(newCarte.業務ID);
      setView('dashboard');
    } catch (e) {
      console.error("Failed to add carte", e);
      // Optionally show an error message to the user
    }
  }, []);
  
  const handleStartNew = useCallback(() => {
    setView('chat');
  }, []);

  const handleClearData = useCallback(async () => {
    if (window.confirm('本当にすべての業務カルテを削除しますか？この操作は元に戻せません。')) {
      try {
        await clearCartesInStorage();
        setCartes([]);
        setView('chat'); 
      } catch (e) {
        console.error("Failed to clear data", e);
        // Optionally show an error message
      }
    }
  }, []);

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
          </div>
        </nav>
      </header>

      <main className="flex-grow pt-20">
        {view === 'chat' && <ChatView key={Date.now()} onCarteGenerated={handleCarteGenerated} />}
        {view === 'dashboard' && <DashboardView cartes={cartes} onStartNew={handleStartNew} onClearData={handleClearData} highlightId={currentCarteId} />}
      </main>
    </div>
  );
};

export default App;
