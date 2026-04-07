import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'active';
export type CallType = 'audio' | 'video';

export const useWebRTC = (socket: Socket | null, roomId: string) => {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('video');
  const [caller, setCaller] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize Peer Connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', { roomId, candidate: event.candidate, toUserId: caller?.id });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.current = pc;
    return pc;
  }, [socket, roomId, caller]);

  // Start Call
  const startCall = async (type: CallType) => {
    setCallType(type);
    setStatus('calling');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: type === 'video', 
        audio: true 
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('call_user', { roomId, offer, callType: type });
    } catch (err) {
      console.error('Error starting call:', err);
      setStatus('idle');
    }
  };

  // Answer Call
  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: callType === 'video', 
        audio: true 
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      if (caller?.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(caller.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket?.emit('answer_call', { roomId, answer, toUserId: caller.id });
        setStatus('active');
      }
    } catch (err) {
      console.error('Error answering call:', err);
      endCall();
    }
  };

  // End Call
  const endCall = () => {
    socket?.emit('end_call', { roomId });
    cleanup();
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setStatus('idle');
    setCaller(null);
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', ({ from, offer, callType: incomingType }) => {
      setCaller({ ...from, offer });
      setCallType(incomingType);
      setStatus('incoming');
    });

    socket.on('call_answered', async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setStatus('active');
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ice candidate', e);
        }
      }
    });

    socket.on('call_ended', () => {
      cleanup();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_ended');
    };
  }, [socket]);

  return {
    status,
    callType,
    caller,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall
  };
};
