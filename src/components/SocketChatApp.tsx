import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, User, Phone, Video, Settings, LogOut, Search, Send, Smile, Paperclip, File, X, Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import CallOverlay from './CallOverlay';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface SocketChatAppProps {
  session: Session;
}

interface Message {
  id: string;
  type: 'text' | 'file';
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  reactions?: Record<string, string[]>; // emoji -> [userId1, userId2]
  user: {
    id: string;
    name: string;
    image?: string;
  };
  timestamp: string;
}

const COMMON_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const SocketChatApp = ({ session }: SocketChatAppProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeRoom] = useState('general');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket, isConnected } = useSocket('http://localhost:3001');
  const scrollRef = useRef<HTMLDivElement>(null);

  const user = {
    id: session.user.id,
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Anonymous',
    image: `https://getstream.io/random_svg/?id=${session.user.id}&name=${session.user.user_metadata?.name || 'User'}`,
  };

  const {
    status: callStatus,
    callType,
    caller,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall
  } = useWebRTC(socket, activeRoom);

  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join_room', { roomId: activeRoom, user });

      socket.on('receive_message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on('load_history', (history: Message[]) => {
        setMessages(history);
      });

      socket.on('receive_reaction', ({ messageId, emoji, userId }) => {
        setMessages((prev) => prev.map(msg => {
          if (msg.id !== messageId) return msg;

          const reactions = { ...(msg.reactions || {}) };
          const userList = reactions[emoji] || [];

          if (userList.includes(userId)) {
            reactions[emoji] = userList.filter(id => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...userList, userId];
          }

          return { ...msg, reactions };
        }));
      });

      return () => {
        socket.off('receive_message');
        socket.off('load_history');
        socket.off('receive_reaction');
      };
    }
  }, [socket, isConnected, activeRoom, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !socket) return;

    const messageData = {
      type: 'text',
      text: inputText,
      user
    };

    socket.emit('send_message', { roomId: activeRoom, message: messageData });
    setInputText('');
    setShowEmojiPicker(false);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('send_reaction', { roomId: activeRoom, messageId, emoji });
  };

  const onEmojiClick = (emojiData: any) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const messageData = {
        type: 'file',
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: file.type,
        user
      };

      socket.emit('send_message', { roomId: activeRoom, message: messageData });
    } catch (error: any) {
      console.error('Error uploading file:', error.message);
      alert('Error uploading file. Make sure you created the "chat-files" bucket in Supabase and set it to public!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!isConnected) return (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-indigo-500" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Connecting to Socket.IO Server...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Call Overlay Overlay */}
      <CallOverlay
        status={callStatus}
        callType={callType}
        caller={caller}
        localStream={localStream}
        remoteStream={remoteStream}
        onAnswer={answerCall}
        onEnd={endCall}
      />

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
          <NavItem icon={<LogOut className="w-6 h-6" />} onClick={handleLogout} />
        </div>
      </div>

      {/* Sidebar - Channels */}
      <div className="hidden lg:flex w-80 flex-col bg-slate-900/30 border-r border-slate-800/50 backdrop-blur-lg shrink-0 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Chat App</h1>
            <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
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
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-medium cursor-pointer">
            # general
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-slate-900/20 backdrop-blur-md z-10">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-slate-500">#</span> general
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => startCall('audio')}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all active:scale-95 shadow-md"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => startCall('video')}
              className="p-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl transition-all active:scale-95 shadow-md border border-indigo-500/10"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 group ${msg.user.id === user.id ? 'flex-row-reverse' : ''}`}
              onMouseEnter={() => setHoveredMessage(msg.id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              <img src={msg.user.image} alt={msg.user.name} className="w-10 h-10 rounded-full shrink-0 border border-slate-800 shadow-lg" />

              <div className={`space-y-1 max-w-[70%] relative ${msg.user.id === user.id ? 'items-end flex flex-col' : ''}`}>
                {/* Reaction Bar (Hover) */}
                {hoveredMessage === msg.id && (
                  <div className={`absolute -top-10 z-20 flex gap-1 p-1 bg-slate-800 border border-slate-700 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 ${msg.user.id === user.id ? 'right-0' : 'left-0'
                    }`}>
                    {COMMON_REACTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className="hover:bg-slate-700 p-1.5 rounded-full transition-colors text-sm active:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-medium text-slate-400">{msg.user.name}</span>
                  <span className="text-[10px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="relative group/bubble">
                  {msg.type === 'text' ? (
                    <div className={`p-4 rounded-2xl ${msg.user.id === user.id
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                      } shadow-xl`}>
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`overflow-hidden rounded-2xl border border-slate-800 shadow-xl ${msg.user.id === user.id ? 'bg-indigo-600/20' : 'bg-slate-900'
                      }`}>
                      {msg.fileType?.startsWith('image/') ? (
                        <img src={msg.fileUrl} alt="uploaded content" className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.fileUrl)} />
                      ) : (
                        <div className="p-4 flex items-center gap-3">
                          <div className="p-3 bg-slate-800 rounded-xl">
                            <File className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{msg.fileName}</p>
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">Download file</a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reaction Badges */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={`absolute -bottom-3 flex gap-1 ${msg.user.id === user.id ? 'right-2' : 'left-2'}`}>
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-lg transition-all active:scale-95 ${users.includes(user.id)
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                              : 'bg-slate-800/80 border-slate-700/50 text-slate-400 hover:border-slate-600'
                            }`}
                        >
                          <span>{emoji}</span>
                          <span>{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 pt-2 relative">
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-4 z-50">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute -top-2 -right-2 z-[60] bg-slate-800 p-1 rounded-full border border-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmojiClick} />
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="relative group flex gap-3">
            <div className="flex-1 relative flex items-center">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute left-4 z-10 p-1 text-slate-500 hover:text-indigo-400 transition-colors"
              >
                <Smile className="w-6 h-6" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isUploading ? "Uploading file..." : "Type a message..."}
                disabled={isUploading}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl py-4 px-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute right-4 z-10 p-1 text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
              </button>

              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.zip"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, active = false, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all relative group ${active ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-500 hover:text-slate-100 hover:bg-slate-800'
      }`}>
    {icon}
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"></div>}
  </button>
);

export default SocketChatApp;
