import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiService.getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Real-time socket integration for notification synchronization
  useEffect(() => {
    if (!user) return;

    // Connect to backend socket relative to domain
    const socket = io('/', { path: '/socket.io', autoConnect: true });

    socket.on('connect', () => {
      console.log('Notification socket connected:', socket.id);
      socket.emit('register', user.id);
    });

    const handleUpdate = () => {
      console.log('[SOCKET EVENT] Notification update received');
      fetchNotifications();
      // Dispatch global DOM updates to trigger dashboard reload
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleAnnouncement = () => {
      console.log('[SOCKET EVENT] Announcement created');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('announcement_created'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleAnnouncementDeleted = () => {
      console.log('[SOCKET EVENT] Announcement deleted');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('announcement_deleted'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleEventReg = () => {
      console.log('[SOCKET EVENT] Event registration changed');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('event_registered'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleEventDeleted = () => {
      console.log('[SOCKET EVENT] Event deleted');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('event_deleted'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleClubJoin = () => {
      console.log('[SOCKET EVENT] Club join changed');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('club_joined'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleClubCreated = () => {
      console.log('[SOCKET EVENT] Club created');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('club_created'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleClubDeleted = () => {
      console.log('[SOCKET EVENT] Club deleted');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('club_deleted'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    const handleEventCreated = () => {
      console.log('[SOCKET EVENT] Event created');
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('event_registered'));
      window.dispatchEvent(new CustomEvent('notification_updated'));
    };

    socket.on('notification_created', handleUpdate);
    socket.on('new-notification', handleUpdate);
    socket.on('announcement_created', handleAnnouncement);
    socket.on('announcement_deleted', handleAnnouncementDeleted);
    socket.on('event_registered', handleEventReg);
    socket.on('event_unregistered', handleEventReg);
    socket.on('event_deleted', handleEventDeleted);
    socket.on('club_joined', handleClubJoin);
    socket.on('club_left', handleClubJoin);
    socket.on('club_created', handleClubCreated);
    socket.on('club_deleted', handleClubDeleted);
    socket.on('event_created', handleEventCreated);

    return () => {
      socket.off('notification_created', handleUpdate);
      socket.off('new-notification', handleUpdate);
      socket.off('announcement_created', handleAnnouncement);
      socket.off('announcement_deleted', handleAnnouncementDeleted);
      socket.off('event_registered', handleEventReg);
      socket.off('event_unregistered', handleEventReg);
      socket.off('event_deleted', handleEventDeleted);
      socket.off('club_joined', handleClubJoin);
      socket.off('club_left', handleClubJoin);
      socket.off('club_created', handleClubCreated);
      socket.off('club_deleted', handleClubDeleted);
      socket.off('event_created', handleEventCreated);
      socket.disconnect();
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id) => {
    // Optimistic Update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    try {
      await apiService.markNotificationRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    // Optimistic Update
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    try {
      await apiService.markAllNotificationsRead(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const dismissNotification = async (id) => {
    // Optimistic Update
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await apiService.dismissNotification(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, refreshNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

