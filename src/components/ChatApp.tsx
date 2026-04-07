import { useState, useEffect } from 'react';
import { MessageSquare, Plus, User, Phone, Video, Settings, LogOut, Search } from 'lucide-react';
import { Chat, Channel, ChannelList, Window, ChannelHeader, MessageList, MessageInput, Thread, useCreateChatClient } from 'stream-chat-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ChatAppProps {
  session: Session;
}

const apiKey = import.meta.env.VITE_STREAM_API_KEY || '4x2r59h2bf3g';

// WARNING: Development only. This uses a real signature to satisfy Stream's Production Mode.
// In a real app, this MUST move to a backend (like Supabase Edge Functions).
async function generateSignedToken(userId: string) {
  const apiSecret = 'zeea4agvjxb24p65skdszzq88grp7fv2man67sukz3u6enpjftah9mfxvs9zmhyv';
  
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { user_id: userId };
  
  const base64Url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const key = await window.crypto.subtle.importKey(
    "raw", 
    new TextEncoder().encode(apiSecret), 
    { name: "HMAC", hash: "SHA-256" }, 
    false, 
    ["sign"]
  );
  
  const signature = await window.crypto.subtle.sign("HMAC", key, data);
  const encodedSignature = base64Url(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

const ChatApp = ({ session }: ChatAppProps) => {
  const [token, setToken] = useState<string | null>(null);
  
  const user = {
    id: session.user.id,
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Anonymous',
    image: `https://getstream.io/random_svg/?id=${session.user.id}&name=${session.user.user_metadata?.name || 'User'}`,
  };

  useEffect(() => {
    generateSignedToken(user.id).then(setToken);
  }, [user.id]);

  const client = useCreateChatClient({
    apiKey,
    userData: user,
    tokenOrProvider: token,
  });

  const createChannel = async () => {
    if (!client) return;
    const channel = client.channel('livestream', 'general', {
      name: 'General Chat',
      members: [user.id],
    } as any);
    await channel.watch();
    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!client) return (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center">
           <MessageSquare className="w-6 h-6 text-indigo-500" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Connecting to Stream Chat...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Chat client={client} theme="str-chat__theme-dark">
        {/* Sidebar - Navigation */}
        <div className="w-16 md:w-20 flex flex-col items-center py-6 bg-slate-900/50 border-r border-slate-800/50 backdrop-blur-xl shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 flex flex-col gap-6 items-center">
              <NavItem icon={<User className="w-6 h-6" />} active />
              <NavItem icon={<Phone className="w-6 h-6" />} />
              <NavItem icon={<Video className="w-6 h-6" />} />
              <NavItem icon={<Settings className="w-6 h-6" />} />
          </div>

          <div className="mt-auto">
               <NavItem icon={<LogOut className="w-6 h-6" onClick={handleLogout} />} />
          </div>
        </div>

        {/* Sidebar - Channels */}
        <div className="hidden lg:flex w-80 flex-col bg-slate-900/30 border-r border-slate-800/50 backdrop-blur-lg shrink-0 overflow-hidden">
           <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Messages</h1>
                <button 
                  onClick={createChannel}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5 text-slate-300" />
                </button>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
           </div>
           <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
             <ChannelList 
               filters={{ type: 'livestream' }}
               sort={{ last_message_at: -1 }}
             />
           </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
          <Channel>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </div>
      </Chat>
    </div>
  );
};

const NavItem = ({ icon, active = false, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all relative group ${
    active ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-800'
  }`}>
    {icon}
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"></div>}
    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
      Tooltip
    </div>
  </button>
);

export default ChatApp;
