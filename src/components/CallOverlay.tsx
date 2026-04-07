import { useEffect, useRef } from 'react';
import { PhoneOff, Mic, Video, User } from 'lucide-react';
import type { CallStatus, CallType } from '../hooks/useWebRTC';

interface CallOverlayProps {
  status: CallStatus;
  callType: CallType;
  caller: any;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer: () => void;
  onEnd: () => void;
}

const CallOverlay = ({ status, callType, caller, localStream, remoteStream, onAnswer, onEnd }: CallOverlayProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (status === 'idle') return null;

  if (status === 'incoming') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 w-80 text-center">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center p-0.5 border-4 border-indigo-500/20">
             <img src={caller?.image} alt={caller?.name} className="w-full h-full rounded-full border border-slate-800" />
          </div>
          <div className="space-y-1">
             <h3 className="text-xl font-bold text-white uppercase tracking-wider">{caller?.name}</h3>
             <p className="text-slate-400 text-sm">Incoming {callType} call...</p>
          </div>
          <div className="flex gap-4 w-full">
             <button 
               onClick={onEnd}
               className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95"
             >
                <PhoneOff className="w-6 h-6" />
             </button>
             <button 
               onClick={onAnswer}
               className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl flex items-center justify-center shadow-lg animate-bounce transition-all active:scale-95"
             >
                <PhoneOff className="w-6 h-6 rotate-[135deg]" />
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 overflow-hidden flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 font-sans">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
          {callType === 'video' ? (
              remoteStream ? (
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-40 h-40 bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 p-1">
                         <img src={status === 'calling' ? '/logo.png' : caller?.image} alt="Caller" className="w-full h-full rounded-full border border-slate-800" />
                    </div>
                    <p className="text-slate-400 text-lg font-medium animate-pulse">
                        {status === 'calling' ? 'Calling...' : `Chatting with ${caller?.name}`}
                    </p>
                </div>
              )
          ) : (
            <div className="flex flex-col items-center gap-6">
                 <div className="w-40 h-40 bg-indigo-600/10 rounded-full flex items-center justify-center border border-indigo-500/20 p-8 shadow-2xl">
                     <User className="w-full h-full text-indigo-400" />
                 </div>
                 <p className="text-slate-200 text-2xl font-bold tracking-tight">Voice Call Active</p>
            </div>
          )}
      </div>

      {/* Local Video (Small Preview) */}
      {callType === 'video' && status === 'active' && (
        <div className="absolute top-8 right-8 z-30 w-48 h-64 bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
           <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]" 
           />
        </div>
      )}

      {/* Call Controls */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 p-2 rounded-[2rem] flex items-center gap-3 shadow-2xl">
         <CallButton icon={<Mic className="w-6 h-6" />} />
         <CallButton icon={<Video className="w-6 h-6" />} />
         <div className="w-px h-8 bg-slate-800/50 mx-2"></div>
         <button 
           onClick={onEnd}
           className="bg-red-600 hover:bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20 transition-all active:scale-95"
         >
           <PhoneOff className="w-6 h-6" />
         </button>
      </div>
    </div>
  );
};

const CallButton = ({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) => (
  <button className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
    active ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
  }`}>
    {icon}
  </button>
);

export default CallOverlay;
