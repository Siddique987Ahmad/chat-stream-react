import { useState, useEffect } from 'react';
import ChatApp from "./components/ChatApp";
import SocketChatApp from "./components/SocketChatApp";
import Auth from "./components/Auth";
import { supabase } from "./lib/supabase";
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'stream' | 'socket'>('stream');

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans antialiased flex items-center justify-center">
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased relative">
      {/* Mode Switcher */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex p-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl">
        <button 
          onClick={() => setMode('stream')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${mode === 'stream' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Stream
        </button>
        <button 
          onClick={() => setMode('socket')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${mode === 'socket' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Socket.IO
        </button>
      </div>

      {mode === 'stream' ? (
        <ChatApp session={session} />
      ) : (
        <SocketChatApp session={session} />
      )}
    </div>
  );
}

export default App;