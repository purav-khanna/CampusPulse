/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const socketRef = useRef(null);
  
  const [conversationsList, setConversationsList] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> { userId: userName }
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loadingConvos, setLoadingConvos] = useState(false);

  // Extract activeConvoId from URL path
  const getActiveConvoIdFromPath = () => {
    const parts = location.pathname.split('/');
    if (parts[1] === 'chat' && parts[2]) {
      return parts[2];
    }
    return null;
  };
  
  const activeConvoId = getActiveConvoIdFromPath();
  const activeConvoIdRef = useRef(activeConvoId);
  
  useEffect(() => {
    activeConvoIdRef.current = activeConvoId;
  }, [activeConvoId]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    setLoadingConvos(true);
    try {
      const data = await apiService.getConversations(user.id);
      setConversationsList(data);
      
      // Calculate total unread
      const unread = data.reduce((sum, c) => sum + (c.unread || 0), 0);
      setTotalUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching conversations in context:', error);
    } finally {
      setLoadingConvos(false);
    }
  };

  // Fetch convos on user load/change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations();
    } else {
      setConversationsList([]);
      setTotalUnreadCount(0);
      setActiveMessages([]);
    }
  }, [user, isAuthenticated]);

  // Sync active messages, join rooms, and mark messages read
  useEffect(() => {
    if (!isAuthenticated || !user || !activeConvoId) {
      setActiveMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const messages = await apiService.getConversationMessages(activeConvoId, user.id);
        setActiveMessages(messages);
        
        // Reset unread count locally for this conversation in the UI list
        setConversationsList(prev => {
          const list = prev.map(c => c.id === activeConvoId ? { ...c, unread: 0 } : c);
          const unread = list.reduce((sum, c) => sum + (c.unread || 0), 0);
          setTotalUnreadCount(unread);
          return list;
        });

        // Send mark-read event to socket
        socketRef.current?.emit('mark-read', { conversationId: activeConvoId, userId: user.id });
      } catch (err) {
        console.error('Error loading messages in ChatContext:', err);
      }
    };

    loadMessages();
    
    // Join socket room
    socketRef.current?.emit('join-room', activeConvoId);

    return () => {
      if (activeConvoId) {
        socketRef.current?.emit('leave-room', activeConvoId);
      }
    };
  }, [activeConvoId, user, isAuthenticated]);

  // Manage socket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect relative to current domain/origin (leverage Vite proxy ws: true)
    const socket = io('/', {
      path: '/socket.io',
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Context Socket connection established:', socket.id);
      socket.emit('register', user.id);
    });

    socket.on('user-status', ({ userId, status }) => {
      setConversationsList(prev => prev.map(c => {
        if (c.type === 'direct' && c.otherUserId === userId) {
          return { ...c, online: status === 'online' };
        }
        return c;
      }));
    });

    socket.on('new-message', (msg) => {
      // Dispatch global DOM events to trigger dashboard reload
      window.dispatchEvent(new CustomEvent('message_received'));
      window.dispatchEvent(new CustomEvent('notification_updated'));

      const convoId = msg.conversationId;
      const formattedMsg = {
        ...msg,
        isOwn: msg.senderId === user.id
      };

      // Append message locally if viewing this conversation, and mark read
      if (convoId === activeConvoIdRef.current) {
        setActiveMessages(prev => {
          if (prev.some(m => m.id === formattedMsg.id)) return prev;
          return [...prev, formattedMsg];
        });
        socket.emit('mark-read', { conversationId: convoId, userId: user.id });
      }

      // Update conversations sidebar list: increment unread, update last message, and move to top
      setConversationsList(prev => {
        const isCurrentActive = convoId === activeConvoIdRef.current;
        
        // Check if conversation exists in current list
        const exists = prev.some(c => c.id === convoId);
        
        if (!exists) {
          // If conversation is direct and does not exist in sidebar list, we should fetch it or reload list
          // But as a fallback we can reload conversations list
          fetchConversations();
          return prev;
        }

        const list = prev.map(c => {
          if (c.id === convoId) {
            return {
              ...c,
              unread: isCurrentActive ? 0 : c.unread + 1,
              lastMessage: msg.content || 'File attachment',
              lastTime: msg.time,
              lastMessageAt: new Date().toISOString()
            };
          }
          return c;
        });

        // Calculate total unread count
        const unread = list.reduce((sum, c) => sum + (c.unread || 0), 0);
        setTotalUnreadCount(unread);

        // Sort: latest active conversation at the top (WhatsApp style)
        return list.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    });

    socket.on('messages-read', ({ conversationId, readerId }) => {
      if (readerId !== user.id && conversationId === activeConvoIdRef.current) {
        setActiveMessages(prev => prev.map(m => {
          if (m.senderId === user.id && m.readStatus !== 'read') {
            return { ...m, readStatus: 'read' };
          }
          return m;
        }));
      }
    });

    socket.on('typing', ({ conversationId, userId, userName, isTyping }) => {
      setTypingUsers(prev => {
        const convoTyping = { ...(prev[conversationId] || {}) };
        if (isTyping) {
          convoTyping[userId] = userName;
        } else {
          delete convoTyping[userId];
        }
        return { ...prev, [conversationId]: convoTyping };
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, isAuthenticated]);

  return (
    <ChatContext.Provider value={{
      conversationsList,
      setConversationsList,
      activeMessages,
      setActiveMessages,
      typingUsers,
      setTypingUsers,
      totalUnreadCount,
      setTotalUnreadCount,
      activeConvoId,
      socketRef,
      fetchConversations,
      loadingConvos
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
