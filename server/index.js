import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());

// Supabase Configuration (Hardcoded for dev, should be process.env for prod)
const SUPABASE_URL = 'https://jvkrljefukcrlomnqrdl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2a3JsamVmdWtjcmxvbW5xcmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDkzODIsImV4cCI6MjA5MTEyNTM4Mn0.4y3UKlUJXMle28QmCJObdygibZHwyuZmk--aukSLT94';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

const socketUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async ({ roomId, user }) => {
    socket.join(roomId);
    socketUsers.set(socket.id, user);
    console.log(`User ${user.name} joined room: ${roomId}`);

    // FETCH HISTORY - Load last 50 messages and their reactions
    try {
      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (msgError) throw msgError;

      // Group reactions by message_id
      const messageIds = messages.map(m => m.id);
      const { data: reactions, error: reactError } = await supabase
        .from('chat_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (reactError) throw reactError;

      // Enriched messages with reactions in the format frontend expects
      const enrichedHistory = messages.reverse().map(msg => {
        const msgReactions = {};
        reactions
          .filter(r => r.message_id === msg.id)
          .forEach(r => {
            if (!msgReactions[r.emoji]) msgReactions[r.emoji] = [];
            msgReactions[r.emoji].push(r.user_id);
          });

        return {
          id: msg.id,
          type: msg.type,
          text: msg.text,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileType: msg.file_type,
          timestamp: msg.created_at,
          reactions: msgReactions,
          user: {
            id: msg.user_id,
            name: msg.user_name,
            image: msg.user_image
          }
        };
      });

      socket.emit('load_history', enrichedHistory);
    } catch (err) {
      console.error('Error loading history:', err.message);
    }
  });

  socket.on('send_message', async ({ roomId, message }) => {
    const user = socketUsers.get(socket.id);
    if (!user) return;

    try {
      // SAVE TO SUPABASE
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          type: message.type,
          text: message.text,
          file_url: message.fileUrl,
          file_name: message.fileName,
          file_type: message.fileType,
          user_id: user.id,
          user_name: user.name,
          user_image: user.image
        })
        .select()
        .single();

      if (error) throw error;

      io.to(roomId).emit('receive_message', {
        ...message,
        id: data.id,
        timestamp: data.created_at
      });
    } catch (err) {
      console.error('Error saving message:', err.message);
    }
  });

  socket.on('send_reaction', async ({ roomId, messageId, emoji }) => {
    const user = socketUsers.get(socket.id);
    if (!user) return;

    try {
      // TOGGLE IN DATABASE
      const { data: existing } = await supabase
        .from('chat_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        await supabase
          .from('chat_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        await supabase
          .from('chat_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji
          });
      }

      io.to(roomId).emit('receive_reaction', { 
        messageId, 
        emoji, 
        userId: user.id 
      });
    } catch (err) {
      console.error('Error toggling reaction:', err.message);
    }
  });

  // CALLING SIGNALING
  socket.on('call_user', ({ roomId, offer, callType }) => {
    const user = socketUsers.get(socket.id);
    if (!user) return;
    
    console.log(`Call offer from ${user.id} in ${roomId}`);
    socket.to(roomId).emit('incoming_call', { 
      from: user, 
      offer,
      callType 
    });
  });

  socket.on('answer_call', ({ roomId, answer, toUserId }) => {
    console.log(`Call answer for ${toUserId} in ${roomId}`);
    socket.to(roomId).emit('call_answered', { answer, fromUserId: socketUsers.get(socket.id)?.id });
  });

  socket.on('ice_candidate', ({ roomId, candidate, toUserId }) => {
    socket.to(roomId).emit('ice_candidate', { candidate, fromUserId: socketUsers.get(socket.id)?.id });
  });

  socket.on('end_call', ({ roomId }) => {
    socket.to(roomId).emit('call_ended');
  });

  socket.on('disconnect', () => {
    socketUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO Server with Persistence running on port ${PORT}`);
});
